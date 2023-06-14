<?php

namespace JezveMoney\App\Model;

use DateTime;
use DateInterval;
use DateTimeZone;
use JezveMoney\App\Item\TransactionItem;
use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\SortableModel;
use JezveMoney\Core\Singleton;

use function JezveMoney\Core\inSetCondition;
use function JezveMoney\Core\orJoin;
use function JezveMoney\Core\qnull;

// Transaction types
define("EXPENSE", 1);
define("INCOME", 2);
define("TRANSFER", 3);
define("DEBT", 4);
define("LIMIT_CHANGE", 5);

// Statistics group types
define("GROUP_BY_DAY", INTERVAL_DAY);
define("GROUP_BY_WEEK", INTERVAL_WEEK);
define("GROUP_BY_MONTH", INTERVAL_MONTH);
define("GROUP_BY_YEAR", INTERVAL_YEAR);

const DEFAULT_REPORT_TYPE = "category";
const DEFAULT_TRANSACTION_TYPE = EXPENSE;
const DEFAULT_GROUP_TYPE = GROUP_BY_WEEK;

/**
 * Transaction model
 */
class TransactionModel extends SortableModel
{
    use Singleton;

    public static $availTypes = [EXPENSE, INCOME, TRANSFER, DEBT, LIMIT_CHANGE];
    public static $srcAvailTypes = [EXPENSE, TRANSFER, DEBT, LIMIT_CHANGE];
    public static $srcMandatoryTypes = [EXPENSE, TRANSFER];

    public static $destAvailTypes = [INCOME, TRANSFER, DEBT, LIMIT_CHANGE];
    public static $destMandatoryTypes = [INCOME, TRANSFER];

    private static $availReports = ["account", "currency", "category"];

    private static $availGroupTypes = [
        GROUP_BY_DAY => "day",
        GROUP_BY_WEEK => "week",
        GROUP_BY_MONTH => "month",
        GROUP_BY_YEAR => "year",
    ];

    private static $durationMap = [
        GROUP_BY_DAY => "D",
        GROUP_BY_WEEK => "W",
        GROUP_BY_MONTH => "M",
        GROUP_BY_YEAR => "Y",
    ];

    protected $tbl_name = "transactions";
    protected $accModel = null;
    protected $currMod = null;
    protected $catModel = null;
    protected $affectedTransactions = null;
    protected $balanceChanges = null;
    protected $confirmReminders = null;
    protected $removedItems = null;
    protected $originalTrans = null;

    /**
     * Model initialization
     */
    protected function onStart()
    {
        $this->dbObj = MySqlDB::getInstance();

        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();
        self::$owner_id = $uMod->getOwner();

        $this->accModel = AccountModel::getInstance();
        $this->currMod = CurrencyModel::getInstance();
        $this->catModel = CategoryModel::getInstance();
    }

    /**
     * Converts table row from database to object
     *
     * @param array|null $row array of table row fields
     *
     * @return TransactionItem|null
     */
    protected function rowToObj(?array $row)
    {
        return TransactionItem::fromTableRow($row);
    }

    /**
     * Returns data query object for CachedTable::updateCache()
     *
     * @return \mysqli_result|bool
     */
    protected function dataQuery()
    {
        return $this->dbObj->selectQ("*", $this->tbl_name, "user_id=" . self::$user_id, null, "pos ASC");
    }

    /**
     * Validates item fields before to send create/update request to database
     *
     * @param array $params item fields
     * @param int $item_id item id
     *
     * @return array
     */
    protected function validateParams(array $params, int $item_id = 0)
    {
        $avFields = [
            "type",
            "src_id",
            "dest_id",
            "src_amount",
            "dest_amount",
            "src_curr",
            "dest_curr",
            "date",
            "category_id",
            "comment"
        ];
        $res = [];

        // In CREATE mode all fields is required
        if (!$item_id) {
            checkFields($params, $avFields, true);
        }
        $item = ($item_id) ? $this->getItem($item_id) : null;

        if (isset($params["type"])) {
            $res["type"] = intval($params["type"]);
            if (!in_array($res["type"], self::$availTypes)) {
                throw new \Error("Invalid type specified");
            }
        } else {
            $res["type"] = $item->type;
        }

        $srcAcc = null;
        if (isset($params["src_id"])) {
            $res["src_id"] = intval($params["src_id"]);
            // Check set state of account according to type of transaction
            if (
                ($res["src_id"] && !in_array($res["type"], self::$srcAvailTypes)) ||
                (!$res["src_id"] && in_array($res["type"], self::$srcMandatoryTypes))
            ) {
                throw new \Error("Invalid src_id specified");
            }

            // Check user and owner of account
            if ($res["src_id"]) {
                $srcAcc = $this->accModel->getItem($res["src_id"]);
                if (
                    !$srcAcc
                    || $srcAcc->user_id != self::$user_id
                    || ($res["type"] != DEBT && $srcAcc->owner_id != self::$owner_id)
                ) {
                    throw new \Error("Invalid src_id specified");
                }
            }
        }

        $destAcc = null;
        if (isset($params["dest_id"])) {
            $res["dest_id"] = intval($params["dest_id"]);
            // Check set state of account according to type of transaction
            if (
                ($res["dest_id"] && !in_array($res["type"], self::$destAvailTypes)) ||
                (!$res["dest_id"] && in_array($res["type"], self::$destMandatoryTypes))
            ) {
                throw new \Error("Invalid dest_id specified");
            }

            // Check user and owner of account
            if ($res["dest_id"]) {
                $destAcc = $this->accModel->getItem($res["dest_id"]);
                if (
                    !$destAcc
                    || $destAcc->user_id != self::$user_id
                    || ($res["type"] != DEBT && $destAcc->owner_id != self::$owner_id)
                ) {
                    throw new \Error("Invalid dest_id specified");
                }
            }
        }

        // Check source and destination are not the same
        if (
            isset($res["src_id"])
            && isset($res["dest_id"])
            && $res["src_id"] == $res["dest_id"]
        ) {
            throw new \Error("Source and destination are the same.");
        }

        if (isset($params["src_amount"])) {
            $res["src_amount"] = floatval($params["src_amount"]);
            if ($res["src_amount"] <= 0.0) {
                throw new \Error("Invalid src_amount specified");
            }
        }
        $srcAmount = (isset($res["src_amount"])) ? $res["src_amount"] : $item->src_amount;

        if (isset($params["dest_amount"])) {
            $res["dest_amount"] = floatval($params["dest_amount"]);
            if ($res["dest_amount"] <= 0.0) {
                throw new \Error("Invalid dest_amount specified");
            }
        }
        $destAmount = (isset($res["dest_amount"])) ? $res["dest_amount"] : $item->dest_amount;

        $res["category_id"] = (isset($params["category_id"])) ? intval($params["category_id"]) : 0;
        if ($res["category_id"] !== 0 && !$this->catModel->isExist($res["category_id"])) {
            throw new \Error("Invalid category_id specified");
        }

        if (isset($params["src_curr"])) {
            $res["src_curr"] = intval($params["src_curr"]);
            if (
                !$this->currMod->isExist($res["src_curr"]) ||
                ($srcAcc && $srcAcc->curr_id != $res["src_curr"])
            ) {
                throw new \Error("Invalid src_curr specified");
            }
        }
        $srcCurrId = (isset($res["src_curr"])) ? $res["src_curr"] : $item->src_curr;
        // Check source currency is the same as currency of source account
        if ($srcAcc && $srcAcc->curr_id !== $srcCurrId) {
            throw new \Error("src_curr is not the same as currency of source account");
        }

        if (isset($params["dest_curr"])) {
            $res["dest_curr"] = intval($params["dest_curr"]);
            if (
                !$this->currMod->isExist($res["dest_curr"]) ||
                ($destAcc && $destAcc->curr_id != $res["dest_curr"])
            ) {
                throw new \Error("Invalid dest_curr specified");
            }
        }
        $destCurrId = (isset($res["dest_curr"])) ? $res["dest_curr"] : $item->dest_curr;
        // Check destination currency is the same as currency of destination account
        if ($destAcc && $destAcc->curr_id !== $destCurrId) {
            throw new \Error("dest_curr is not the same as currency of destination account");
        }

        if ($srcCurrId === $destCurrId && $srcAmount != $destAmount) {
            throw new \Error("src_amount and dest_amount must be equal when src_curr and dest_curr are same");
        }

        if (
            $res["type"] === DEBT
            && $srcAcc
            && $srcAcc->owner_id !== self::$owner_id
            && $destAcc
            && $destAcc->owner_id !== self::$owner_id
        ) {
            throw new \Error("Both source and destination accounts are owned by persons");
        }

        if (isset($params["date"])) {
            $res["date"] = intval($params["date"]);
            if (!$res["date"]) {
                throw new \Error("Invalid date specified");
            }
        }

        if (isset($params["comment"])) {
            $res["comment"] = $this->dbObj->escape($params["comment"]);
        }

        return $res;
    }

    /**
     * Converts debt specific params to common transaction fields
     *
     * @param array $params debt fields
     *
     * @return array
     */
    public function prepareDebt(array $params)
    {
        $mandatoryParams = [
            "person_id",
            "op",
            "src_amount",
            "dest_amount",
            "src_curr",
            "dest_curr",
            "date",
            "category_id",
            "comment"
        ];

        checkFields($params, $mandatoryParams, true);

        $res = [
            "type" => DEBT,
        ];

        if (isset($params["id"])) {
            $res["id"] = intval($params["id"]);
        }

        $op = intval($params["op"]);
        if ($op != 1 && $op != 2) {
            throw new \Error("Unknown debt operation: $op");
        }

        $person_id = intval($params["person_id"]);

        $res["src_curr"] = intval($params["src_curr"]);
        $res["dest_curr"] = intval($params["dest_curr"]);
        if (!$res["src_curr"] || !$res["dest_curr"]) {
            throw new \Error("Invalid currency");
        }

        $personCurrencyId = ($op == 1) ? $res["src_curr"] : $res["dest_curr"];
        $personAccount = $this->accModel->getPersonAccount($person_id, $personCurrencyId);
        if (!$personAccount) {
            $personAccount = $this->accModel->createPersonAccount($person_id, $personCurrencyId);
        }
        if (!$personAccount) {
            throw new \Error("Fail to obtain person account: person_id: $person_id, curr_id: $personCurrencyId");
        }

        $account_id = isset($params["acc_id"]) ? intval($params["acc_id"]) : 0;

        if ($op == 1) {        // give
            $res["src_id"] = $personAccount->id;
            $res["dest_id"] = $account_id;
        } elseif ($op == 2) {    // take
            $res["src_id"] = $account_id;
            $res["dest_id"] = $personAccount->id;
        }

        $res["src_amount"] = floatval($params["src_amount"]);
        $res["dest_amount"] = floatval($params["dest_amount"]);
        if ($res["src_amount"] == 0.0 || $res["dest_amount"] == 0.0) {
            throw new \Error("Invalid amount");
        }

        $res["date"] = $params["date"];
        $res["category_id"] = $params["category_id"];
        $res["comment"] = $params["comment"];

        return $res;
    }

    /**
     * Saves affected transactions to database
     *
     * @return bool
     */
    protected function commitAffected()
    {
        if (
            !isset($this->affectedTransactions) ||
            !is_array($this->affectedTransactions) ||
            !count($this->affectedTransactions)
        ) {
            return false;
        }

        $curDate = date("Y-m-d H:i:s");

        $this->sortAffected();

        foreach ($this->affectedTransactions as $item_id => $item) {
            $item = (array)$item;

            $res = $this->validateParams($item);

            $res["date"] = date("Y-m-d H:i:s", $item["date"]);

            if (is_string($item["createdate"])) {
                $res["createdate"] = $item["createdate"];
            } else {
                $res["createdate"] = date("Y-m-d H:i:s", $item["createdate"]);
            }

            $res["updatedate"] = $curDate;
            $res["src_result"] = floatval($item["src_result"]);
            $res["dest_result"] = floatval($item["dest_result"]);
            $res["pos"] = intval($item["pos"]);
            $res["user_id"] = self::$user_id;
            $res["id"] = $item["id"];

            $this->affectedTransactions[$item_id] = $res;
        }

        $updResult = $this->dbObj->updateMultipleQ($this->tbl_name, $this->affectedTransactions);
        $this->affectedTransactions = null;

        $this->cleanCache();

        return $updResult;
    }

    /**
     * Returns affected transaction object if available
     *
     * @param mixed $item transaction object
     *
     * @return array|object|null
     */
    protected function getAffected(mixed $item)
    {
        if (!$item || !$item->id) {
            return null;
        }

        if (
            is_null($this->affectedTransactions) ||
            !is_array($this->affectedTransactions) ||
            !isset($this->affectedTransactions[$item->id])
        ) {
            return $item;
        }

        return $this->affectedTransactions[$item->id];
    }

    /**
     * Add item to the affected transactions list
     *
     * @param mixed $item transaction object
     *
     * @return bool
     */
    protected function pushAffected(mixed $item)
    {
        if (!$item || !$item->id) {
            return false;
        }

        if (is_null($this->affectedTransactions)) {
            $this->affectedTransactions = [];
        }

        $this->affectedTransactions[$item->id] = $item;

        return true;
    }

    /**
     * Sorts affected transactions list by position
     */
    protected function sortAffected()
    {
        if (!is_array($this->cache)) {
            return;
        }

        uasort($this->cache, function ($a, $b) {
            $a = $this->getAffected($a);
            $b = $this->getAffected($b);

            return $a->pos - $b->pos;
        });
    }

    /**
     * Checks item create conditions and returns array of expressions
     *
     * @param array $params item fields
     * @param bool $isMultiple flag for multiple create
     *
     * @return array|null
     */
    protected function preCreate(array $params, bool $isMultiple = false)
    {
        $res = $this->validateParams($params);

        if (is_null($this->balanceChanges)) {
            $this->balanceChanges = [];
        }

        $this->balanceChanges = $this->applyTransaction($res, $this->balanceChanges);

        if (is_null($this->confirmReminders)) {
            $this->confirmReminders = [];
        }
        $reminderId = (isset($params["reminder_id"])) ? intval($params["reminder_id"]) : 0;
        $this->confirmReminders[] = $reminderId;

        $res["pos"] = 0;
        $res["date"] = date("Y-m-d H:i:s", $res["date"]);
        $res["src_result"] = ($res["src_id"] != 0)
            ? $this->balanceChanges[$res["src_id"]]["balance"]
            : 0;
        $res["dest_result"] = ($res["dest_id"] != 0)
            ? $this->balanceChanges[$res["dest_id"]]["balance"]
            : 0;
        $res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");
        $res["user_id"] = self::$user_id;

        return $res;
    }

    /**
     * Performs final steps after new item was successfully created
     *
     * @param int|int[]|null $items id or array of created item ids
     *
     * @return bool
     */
    protected function postCreate(mixed $items)
    {
        parent::postCreate($items);

        $items = asArray($items);

        // Commit balance changes for affected accounts
        $this->accModel->updateBalances($this->balanceChanges);
        $this->balanceChanges = null;

        $reminderModel = ReminderModel::getInstance();

        foreach ($items as $item_id) {
            $trObj = $this->getItem($item_id);
            if (!$trObj) {
                return false;
            }

            if (is_array($this->confirmReminders) && count($this->confirmReminders) > 0) {
                $reminderId = array_shift($this->confirmReminders);
                if ($reminderId !== 0) {
                    $reminderModel->confirm($reminderId, [
                        "transaction_id" => $item_id,
                    ]);
                }
            }

            // Update position of transaction if target date is not today
            if ($trObj->pos === 0) {
                $latest_pos = $this->getLatestPos($trObj->date);
                $this->updatePos($item_id, $latest_pos + 1);
            }
        }

        $this->confirmReminders = null;

        $this->commitAffected();

        return true;
    }

    /**
     * Returns affected account object
     *
     * @param int $account_id
     *
     * @return object|null
     */
    protected function getAffectedAccount(int $account_id)
    {
        if (is_array($this->balanceChanges) && isset($this->balanceChanges[$account_id])) {
            return $this->balanceChanges[$account_id];
        } else {
            return $this->accModel->getItem($account_id);
        }
    }

    /**
     * Add specified account to the affected accounts list
     *
     * @param int $account_id acvcount id
     * @param array $accountsList array of accounts
     *
     * @return array
     */
    public function pushBalance(int $account_id, array $accountsList = [])
    {
        $res = $accountsList;

        if (!$account_id) {
            return $res;
        }

        if (!isset($res[$account_id])) {
            $account = $this->getAffectedAccount($account_id);

            $res[$account_id] = [
                "balance" => ($account->balance ?? 0),
                "limit" => ($account->limit ?? 0),
            ];
        }

        return $res;
    }

    /**
     * Applies specified transaction to the list of accounts and returns new state
     * If accounts list not specified returns only impact of transaction
     *
     * @param mixed $trans transaction object
     * @param array $accountsList array of accounts
     *
     * @return array
     */
    public function applyTransaction(mixed $trans, array $accountsList = [])
    {
        if (!$trans) {
            throw new \Error("Invalid Transaction object");
        }

        $trans = (object)$trans;
        $res = $accountsList;

        if ($trans->src_id != 0) {
            $res = $this->pushBalance($trans->src_id, $res);

            $srcCurrency = $this->currMod->getItem($trans->src_curr);
            if (!$srcCurrency) {
                throw new \Error("Currency not found");
            }

            $srcBalance = $res[$trans->src_id]["balance"];
            $res[$trans->src_id]["balance"] = normalize(
                $srcBalance - $trans->src_amount,
                $srcCurrency->precision,
            );

            if ($trans->type === LIMIT_CHANGE) {
                $sourceAccount = $this->accModel->getItem($trans->src_id);
                if ($sourceAccount->type !== ACCOUNT_TYPE_CREDIT_CARD) {
                    throw new \Error("Invalid account type for 'Change credit limit' transaction");
                }

                $srcLimit = $res[$trans->src_id]["limit"];
                $res[$trans->src_id]["limit"] = normalize(
                    $srcLimit - $trans->src_amount,
                    $srcCurrency->precision,
                );
            }
        }

        if ($trans->dest_id != 0) {
            $res = $this->pushBalance($trans->dest_id, $res);

            $destCurrency = $this->currMod->getItem($trans->dest_curr);
            if (!$destCurrency) {
                throw new \Error("Currency not found");
            }

            $destBalance = $res[$trans->dest_id]["balance"];
            $res[$trans->dest_id]["balance"] = normalize(
                $destBalance + $trans->dest_amount,
                $destCurrency->precision,
            );

            if ($trans->type === LIMIT_CHANGE) {
                $destAccount = $this->accModel->getItem($trans->dest_id);
                if ($destAccount->type !== ACCOUNT_TYPE_CREDIT_CARD) {
                    throw new \Error("Invalid account type for 'Change credit limit' transaction");
                }

                $destLimit = $res[$trans->dest_id]["limit"];
                $res[$trans->dest_id]["limit"] = normalize(
                    $destLimit + $trans->dest_amount,
                    $destCurrency->precision,
                );
            }
        }

        return $res;
    }

    /**
     * Cancel changes by specified transaction on list of accounts and return new state
     * If accounts list not specified returns only cancel of transaction impact
     *
     * @param mixed $trans transaction object
     * @param array $accountsList array of accounts
     *
     * @return array
     */
    public function cancelTransaction(mixed $trans, array $accountsList = [])
    {
        if (!$trans) {
            throw new \Error("Invalid Transaction object");
        }

        $trans = (object)$trans;
        $res = $accountsList;

        if ($trans->src_id != 0) {
            $res = $this->pushBalance($trans->src_id, $res);

            $srcCurrency = $this->currMod->getItem($trans->src_curr);
            if (!$srcCurrency) {
                throw new \Error("Currency not found");
            }

            $srcBalance = $res[$trans->src_id]["balance"];
            $res[$trans->src_id]["balance"] = normalize(
                $srcBalance + $trans->src_amount,
                $srcCurrency->precision,
            );

            if ($trans->type === LIMIT_CHANGE) {
                $sourceAccount = $this->accModel->getItem($trans->src_id);
                if ($sourceAccount->type !== ACCOUNT_TYPE_CREDIT_CARD) {
                    throw new \Error("Invalid account type for 'Change credit limit' transaction");
                }

                $srcLimit = $res[$trans->src_id]["limit"];
                $res[$trans->src_id]["limit"] = normalize(
                    $srcLimit + $trans->src_amount,
                    $srcCurrency->precision,
                );
            }
        }

        if ($trans->dest_id != 0) {
            $res = $this->pushBalance($trans->dest_id, $res);

            $destCurrency = $this->currMod->getItem($trans->dest_curr);
            if (!$destCurrency) {
                throw new \Error("Currency not found");
            }

            $destBalance = $res[$trans->dest_id]["balance"];
            $res[$trans->dest_id]["balance"] = normalize(
                $destBalance - $trans->dest_amount,
                $destCurrency->precision,
            );

            if ($trans->type === LIMIT_CHANGE) {
                $destAccount = $this->accModel->getItem($trans->dest_id);
                if ($destAccount->type !== ACCOUNT_TYPE_CREDIT_CARD) {
                    throw new \Error("Invalid account type for 'Change credit limit' transaction");
                }

                $destLimit = $res[$trans->dest_id]["limit"];
                $res[$trans->dest_id]["limit"] = normalize(
                    $destLimit - $trans->dest_amount,
                    $destCurrency->precision,
                );
            }
        }

        return $res;
    }

    /**
     * Checks update conditions and returns array of expressions
     *
     * @param int $item_id item id
     * @param array $params item fields
     *
     * @return array
     */
    protected function preUpdate(int $item_id, array $params)
    {
        $item = $this->getItem($item_id);
        if (!$item) {
            throw new \Error("Item not found");
        }
        if ($item->user_id != self::$user_id) {
            throw new \Error("Invalid user");
        }

        $res = $this->validateParams($params, $item_id);

        $this->originalTrans = $item;

        $canceled = $this->cancelTransaction($item);
        $this->balanceChanges = $this->applyTransaction($res, $canceled);

        // check date is changed
        $orig_date = getdate($item->date);
        $target_date = getdate($res["date"]);

        $orig_time = mktime(0, 0, 0, $orig_date["mon"], $orig_date["mday"], $orig_date["year"]);
        $target_time = mktime(0, 0, 0, $target_date["mon"], $target_date["mday"], $target_date["year"]);

        if ($orig_time != $target_time) {
            $res["pos"] = 0;
        } else {
            $res["pos"] = $item->pos;
        }

        if (isset($res["date"])) {
            $res["date"] = date("Y-m-d H:i:s", $res["date"]);
        }
        $res["src_result"] = ($res["src_id"] != 0)
            ? $this->balanceChanges[$res["src_id"]]["balance"]
            : 0;
        $res["dest_result"] = ($res["dest_id"] != 0)
            ? $this->balanceChanges[$res["dest_id"]]["balance"]
            : 0;
        $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }

    /**
     * Performs final steps after item was successfully updated
     *
     * @param int $item_id item id
     *
     * @return bool
     */
    protected function postUpdate($item_id)
    {
        $this->cleanCache();

        $trObj = $this->getItem($item_id);
        if (!$trObj) {
            return false;
        }

        // Commit balance changes for affected accounts
        $this->accModel->updateBalances($this->balanceChanges);
        $this->balanceChanges = null;

        // update position of transaction if target date was changed
        if ($trObj->pos === 0) {
            $latest_pos = $this->getLatestPos($trObj->date);
            $this->updatePos($item_id, $latest_pos + 1);
        } else {
            $this->updateResults([$trObj->src_id, $trObj->dest_id], $trObj->pos);
        }

        // Update results of accounts
        if (
            ($this->originalTrans->src_id != $trObj->src_id) ||
            ($this->originalTrans->dest_id != $trObj->dest_id)
        ) {
            $this->updateResults([$this->originalTrans->src_id, $this->originalTrans->dest_id], $trObj->pos);
        }
        $this->originalTrans = null;

        $this->commitAffected();

        return true;
    }

    /**
     * Sets category for specified transactions
     *
     * @param int|int[]|null $items id or array of transaction ids
     * @param int $categoryId category id
     *
     * @return bool
     */
    public function setCategory(mixed $items, int $categoryId)
    {
        $catModel = CategoryModel::getInstance();

        $categoryId = intval($categoryId);
        if ($categoryId !== 0 && !$catModel->isExist($categoryId)) {
            throw new \Error("Category not found");
        }

        $items = asArray($items);
        foreach ($items as $item_id) {
            $item = $this->getItem($item_id);
            if (!$item) {
                throw new \Error("Invalid item");
            }
        }

        $data = [
            "category_id" => $categoryId,
            "updatedate" => date("Y-m-d H:i:s"),
        ];

        $updRes = $this->dbObj->updateQ(
            $this->tbl_name,
            $data,
            "id" . inSetCondition($items)
        );
        if (!$updRes) {
            throw new \Error("Failed to update transactions");
        }

        $this->cleanCache();

        return true;
    }

    /**
     * Returns array of transactions within specified range of positions
     *
     * @param int $fromPos start position
     * @param bool $includeFrom if true then start position included to result
     * @param int $toPos end position
     * @param bool $includeTo if true then end position included to result
     *
     * @return array|false
     */
    protected function getRange(int $fromPos, bool $includeFrom, int $toPos, bool $includeTo)
    {
        if (!$this->checkCache()) {
            return false;
        }

        $res = [];
        foreach ($this->cache as $tr_id => $item) {
            $trans = $this->getAffected($item);

            if (
                ($includeFrom && ($trans->pos < $fromPos)) ||
                (!$includeFrom && ($trans->pos <= $fromPos))
            ) {
                continue;
            }

            if (
                ($includeTo && ($trans->pos > $toPos)) ||
                (!$includeTo && ($trans->pos >= $toPos))
            ) {
                continue;
            }

            $res[$tr_id] = $trans;
        }

        return $res;
    }

    /**
     * Updates position of item and fix position of items between old and new position
     *
     * @param int $trans_id transaction id
     * @param int $new_pos position
     *
     * @return bool
     */
    protected function updatePos(int $trans_id, int $new_pos)
    {
        $trans_id = intval($trans_id);
        $new_pos = intval($new_pos);
        if (!$trans_id || !$new_pos) {
            return false;
        }

        $trObj = $this->getItem($trans_id);
        if (!$trObj) {
            return false;
        }

        if ($trObj->user_id != self::$user_id) {
            return false;
        }

        $old_pos = $trObj->pos;
        if ($old_pos == $new_pos) {
            return true;
        } elseif ($this->isPosExist($new_pos)) {
            if ($old_pos == 0) {           // insert with specified position
                $latest = $this->getLatestPos();

                $affectedRange = $this->getRange($new_pos, true, $latest, true);
                foreach ($affectedRange as $item) {
                    if ($item->date < $trObj->date) {
                        return false;
                    }

                    $queryItem = clone $item;
                    $queryItem->pos++;
                    $this->pushAffected($queryItem);
                }
            } elseif ($new_pos < $old_pos) {       // moving up
                $affectedRange = $this->getRange($new_pos, true, $old_pos, false);
                foreach ($affectedRange as $item) {
                    if ($item->date < $trObj->date) {
                        return false;
                    }

                    $queryItem = clone $item;
                    $queryItem->pos++;
                    $this->pushAffected($queryItem);
                }
            } elseif ($new_pos > $old_pos) {        // moving down
                $affectedRange = $this->getRange($old_pos, false, $new_pos, true);
                foreach ($affectedRange as $item) {
                    if ($item->date > $trObj->date) {
                        return false;
                    }

                    $queryItem = clone $item;
                    $queryItem->pos--;
                    $this->pushAffected($queryItem);
                }
            }
        }

        $queryItem = clone $trObj;
        $queryItem->pos = $new_pos;
        $this->pushAffected($queryItem);
        $this->sortAffected();

        if (!$old_pos && isset($this->originalTrans)) {
            $old_pos = $this->originalTrans->pos;
        }

        $updateFromPos = ($old_pos != 0) ? min($old_pos, $new_pos) : $new_pos;
        $this->updateResults([$trObj->src_id, $trObj->dest_id], $updateFromPos);

        return true;
    }

    /**
     * Updates position of transaction and commit affected transactions
     *
     * @param array $request
     *
     * @return bool
     */
    public function updatePosition(array $request)
    {
        $changePosFields = ["id", "pos"];
        checkFields($request, $changePosFields, true);

        $item_id = intval($request["id"]);
        $new_pos = intval($request["pos"]);
        $res = $this->updatePos($item_id, $new_pos);
        if ($res) {
            $this->commitAffected();
        }

        return $res;
    }

    /**
     * Returns result balance of account before transaction with specified position
     *
     * @param int $acc_id account id
     * @param int|bool|null $pos position or false to use latest position
     *
     * @return float|null
     */
    public function getLatestResult(int $acc_id, mixed $pos = false)
    {
        $acc_id = intval($acc_id);
        if (!$acc_id) {
            return null;
        }
        if ($pos === false) {
            $pos = $this->getLatestPos() + 1;
        }

        $res = null;
        if ($pos > 1) {
            $posOfRes = 0;
            foreach ($this->cache as $item) {
                $trans = $this->getAffected($item);

                if ($trans->src_id != $acc_id && $trans->dest_id != $acc_id) {
                    continue;
                }
                if (!$trans->pos || $trans->pos >= $pos || $trans->pos <= $posOfRes) {
                    continue;
                }

                $res = ($trans->src_id == $acc_id) ? $trans->src_result : $trans->dest_result;
                $posOfRes = $trans->pos;
            }
        }

        if (is_null($res)) {
            $accObj = $this->accModel->getItem($acc_id);
            $res = ($accObj) ? $accObj->initbalance : null;
        }

        return $res;
    }

    /**
     * Updates result balance values of specified transactions
     *
     * @param mixed $accounts id or arrays of account ids to filter transactions by
     * @param int $pos position of transaction to start update from, inclusively
     *
     * @return bool
     */
    protected function updateResults(mixed $accounts, int $pos)
    {
        $accounts = skipZeros($accounts);

        // Get previous results
        $results = [];
        foreach ($accounts as $account_id) {
            $account = $this->getAffectedAccount($account_id);
            if (!$account) {
                continue;
            }

            $results[$account_id] = [
                "balance" => $this->getLatestResult($account_id, $pos),
                "limit" => $account->limit,
            ];
        }

        // Request affected transactions
        if (!$this->checkCache()) {
            return false;
        }

        foreach ($this->cache as $item) {
            $tr = $this->getAffected($item);

            if (!in_array($tr->src_id, $accounts) && !in_array($tr->dest_id, $accounts)) {
                continue;
            }
            if ($tr->pos < $pos) {
                continue;
            }

            $queryItem = null;
            $results = $this->applyTransaction($tr, $results);

            if (
                in_array($tr->type, self::$srcAvailTypes) &&
                $tr->src_id &&
                in_array($tr->src_id, $accounts)
            ) {
                if (is_null($queryItem)) {
                    $queryItem = clone $tr;
                }

                $queryItem->src_result = $results[$tr->src_id]["balance"];
            }

            if (
                in_array($tr->type, self::$destAvailTypes) &&
                $tr->dest_id &&
                in_array($tr->dest_id, $accounts)
            ) {
                if (is_null($queryItem)) {
                    $queryItem = clone $tr;
                }

                $queryItem->dest_result = $results[$tr->dest_id]["balance"];
            }

            if (!is_null($queryItem)) {
                $this->pushAffected($queryItem);
            }
        }

        return true;
    }

    /**
     * Checks delete conditions and returns bool result
     *
     * @param array $items array of item ids to remove
     *
     * @return bool
     */
    protected function preDelete(array $items)
    {
        $this->balanceChanges = [];
        $this->removedItems = [];
        foreach ($items as $item_id) {
            // check transaction is exists
            $trObj = $this->getItem($item_id);
            if (!$trObj) {
                return false;
            }

            // cancel transaction
            $this->balanceChanges = $this->cancelTransaction($trObj, $this->balanceChanges);

            $this->removedItems[] = clone $trObj;

            unset($this->cache[$trObj->id]);
        }

        $reminderModel = ReminderModel::getInstance();
        $reminderModel->onTransactionDelete($items);

        return true;
    }

    /**
     * Performs final steps after items were successfully removed
     *
     * @param array $items ids array of removed items
     *
     * @return bool
     */
    protected function postDelete(array $items)
    {
        // Commit balance changes for affected accounts
        $this->accModel->updateBalances($this->balanceChanges);
        $this->balanceChanges = null;

        foreach ($this->removedItems as $trObj) {
            $this->updateResults([$trObj->src_id, $trObj->dest_id], $trObj->pos + 1);
        }
        $this->removedItems = null;

        $this->commitAffected();

        $this->cleanCache();

        return true;
    }

    /**
     * Returns latest position of transaction
     * In case date is specified returns latest position before this date
     *
     * @param int|bool|null $trans_date date
     *
     * @return int
     */
    public function getLatestPos(mixed $trans_date = false)
    {
        if (!$this->checkCache()) {
            return 0;
        }

        $res = 0;
        foreach ($this->cache as $item) {
            $trans = $this->getAffected($item);

            if ($trans_date !== false && $trans->date > $trans_date) {
                continue;
            }

            $res = max($trans->pos, $res);
        }

        return $res;
    }

    /**
     * Removes all transactions of user
     *
     * @param bool $keepAccountBalance if true current balance of accounts is preserved,
     *                                  initial balance in restored otherwise
     *
     * @return bool
     */
    public function reset(bool $keepAccountBalance = false)
    {
        $setCond = inSetCondition(self::$user_id);
        if (is_null($setCond)) {
            return true;
        }

        // Prepare balance updates for accounts
        $userAccounts = $this->accModel->getData(["owner" => "all", "visibility" => "all"]);
        $balanceChanges = [];
        foreach ($userAccounts as $account) {
            $balance = ($keepAccountBalance) ? $account->balance : $account->initbalance;
            $balanceChanges[$account->id] = [
                "balance" => $balance,
                "limit" => $account->limit,
            ];
        }
        $this->accModel->updateBalances($balanceChanges);

        // delete all transactions of user
        if (!$this->dbObj->deleteQ($this->tbl_name, "user_id" . $setCond)) {
            return false;
        }

        $this->cleanCache();

        return true;
    }

    /**
     * Handles account update event
     *
     * @param int $acc_id account id
     *
     * @return bool
     */
    public function onAccountUpdate(int $acc_id)
    {
        $accObj = $this->accModel->getItem($acc_id);
        if (!$accObj) {
            return false;
        }

        if (!$this->checkCache()) {
            return false;
        }

        $new_curr = $accObj->curr_id;
        $isCreditCard = $accObj->type === ACCOUNT_TYPE_CREDIT_CARD;

        foreach ($this->cache as $item) {
            $trans = $this->getAffected($item);

            if ($trans->src_id != $acc_id && $trans->dest_id != $acc_id) {
                continue;
            }

            if ($trans->src_id == $acc_id) {
                $trans->src_curr = $new_curr;
                if ($trans->dest_curr == $new_curr) {
                    $trans->src_amount = $trans->dest_amount;
                }

                if ($trans->type === LIMIT_CHANGE && !$isCreditCard) {
                    $trans->type = EXPENSE;
                }
            }

            if ($trans->dest_id == $acc_id) {
                $trans->dest_curr = $new_curr;
                if ($trans->src_curr == $new_curr) {
                    $trans->dest_amount = $trans->src_amount;
                }

                if ($trans->type === LIMIT_CHANGE && !$isCreditCard) {
                    $trans->type = INCOME;
                }
            }

            $this->pushAffected($trans);
        }

        $this->updateResults($acc_id, 0);

        $this->commitAffected();

        return true;
    }

    /**
     * Handles account delete event
     * Removes specified accounts from transactions
     *
     * @param mixed $accounts id or array of account ids
     *
     * @return bool
     */
    public function onAccountDelete(mixed $accounts)
    {
        if (!self::$user_id || is_null($accounts)) {
            return false;
        }

        $uMod = UserModel::getInstance();
        $uObj = $uMod->getItem(self::$user_id);
        if (!$uObj) {
            throw new \Error("User not found");
        }

        $accounts = asArray($accounts);
        $ids = [];
        $personAccounts = [];
        $userAccounts = [];
        foreach ($accounts as $accObj) {
            $ids[] = $accObj->id;

            if ($accObj->owner_id == $uObj->owner_id) {
                $userAccounts[] = $accObj->id;
            } else {
                $personAccounts[] = $accObj->id;
            }
        }

        if (!$this->checkCache()) {
            return false;
        }

        $idsToRemove = [];
        foreach ($this->cache as $item_id => $item) {
            $trans = $this->getAffected($item);

            $srcMatch = in_array($trans->src_id, $ids);
            $destMatch = in_array($trans->dest_id, $ids);
            if (!$srcMatch && !$destMatch) {
                continue;
            }

            if (
                ($srcMatch && $destMatch) ||
                ($srcMatch && $trans->dest_id == 0) ||
                ($destMatch && $trans->src_id == 0)
            ) {
                $idsToRemove[] = $item_id;
                unset($this->cache[$item_id]);
                continue;
            }

            $queryItem = null;

            // check account of person

            // set outgoing debt(person take) as income to destination account
            if ($trans->type == DEBT && in_array($trans->src_id, $personAccounts)) {
                $queryItem = clone $trans;
                $queryItem->type = INCOME;
                $queryItem->src_id = 0;
                $queryItem->src_result = 0;
            }

            // set incoming debt(person give) as expense from source account
            if ($trans->type == DEBT && in_array($trans->dest_id, $personAccounts)) {
                $queryItem = clone $trans;
                $queryItem->type = EXPENSE;
                $queryItem->dest_id = 0;
                $queryItem->dest_result = 0;
            }

            // check account of user

            // set outgoing debt(person take) as debt without acc
            if ($trans->type == DEBT && in_array($trans->src_id, $userAccounts)) {
                $queryItem = clone $trans;
                $queryItem->src_id = 0;
                $queryItem->src_result = 0;
            }

            // set incoming debt(person give) as debt without acc
            if ($trans->type == DEBT && in_array($trans->dest_id, $userAccounts)) {
                $queryItem = clone $trans;
                $queryItem->dest_id = 0;
                $queryItem->dest_result = 0;
            }

            // set transfer from account as income to destination account
            if ($trans->type == TRANSFER && $srcMatch) {
                $queryItem = clone $trans;
                $queryItem->type = INCOME;
                $queryItem->src_id = 0;
                $queryItem->src_result = 0;
            }

            // set transfer to account as expense from source account
            if ($trans->type == TRANSFER && $destMatch) {
                $queryItem = clone $trans;
                $queryItem->type = EXPENSE;
                $queryItem->dest_id = 0;
                $queryItem->dest_result = 0;
            }

            if (!is_null($queryItem)) {
                $this->pushAffected($queryItem);
            }
        }

        // Update results of transactions with affected accounts
        $this->updateResults($ids, 0);

        if (count($idsToRemove) > 0) {
            if (!$this->dbObj->deleteQ($this->tbl_name, "id" . inSetCondition($idsToRemove))) {
                return false;
            }

            $this->cleanCache();
        }

        $this->commitAffected();

        return true;
    }

    /**
     * Handles category delete event
     * Update transactions with removed categories
     *
     * @param mixed $categories id or array of category ids
     *
     * @return bool
     */
    public function onCategoryDelete(mixed $categories)
    {
        if (is_null($categories)) {
            return false;
        }

        $categories = asArray($categories);
        if (count($categories) === 0) {
            return true;
        }

        $updRes = $this->dbObj->updateQ(
            $this->tbl_name,
            ["category_id" => 0],
            "category_id" . inSetCondition($categories)
        );
        if (!$updRes) {
            return false;
        }

        $this->cleanCache();

        return true;
    }

    /**
     * Returns condition string for list of accounts
     *
     * @param mixed $accounts
     *
     * @return string|null
     */
    private function getAccCondition(mixed $accounts = null)
    {
        $setCond = inSetCondition($accounts);
        if (is_null($setCond)) {
            return null;
        }

        return orJoin(["src_id" . $setCond, "dest_id" . $setCond]);
    }

    /**
     * Returns list of accounts of specified persons
     *
     * @param int|int[]|null $persons id or array of person ids
     *
     * @return array|null
     */
    private function getPersonAccounts(mixed $persons = null)
    {
        if (is_null($persons)) {
            return null;
        }

        $persons = asArray($persons);
        $res = [];
        foreach ($persons as $personId) {
            $accounts = $this->accModel->getData(["owner" => $personId]);
            if (count($accounts) > 0) {
                foreach ($accounts as $account) {
                    $res[] = $account->id;
                }
            } else {
                $res[] = -1;
            }
        }

        return $res;
    }

    /**
     * Returns list of categories and all of its child categories
     *
     * @param int|int[]|null $categories  id or array of category ids
     *
     * @return int[]|null
     */
    private function getCategoriesSet(mixed $categories = null)
    {
        if (is_null($categories)) {
            return null;
        }

        $categories = asArray($categories);
        $res = [];
        foreach ($categories as $categoryId) {
            $res[] = intval($categoryId);

            if ($categoryId === 0) {
                continue;
            }

            $children = $this->catModel->getData([
                "parent_id" => $categoryId,
                "returnIds" => true,
            ]);
            if (is_array($children)) {
                array_push($res, ...$children);
            }
        }

        return $res;
    }

    /**
     * Returns condition string for list of categories
     *
     * @param int|int[]|null $categories id or array of category ids
     *
     * @return string|null
     */
    private function getCategoryCondition(mixed $categories = null)
    {
        $setCond = inSetCondition($categories, false);
        if (is_null($setCond)) {
            return null;
        }

        return "category_id" . $setCond;
    }

    /**
     * Returns condition string for list of types
     *
     * @param int|int[]|null $types id or array of category ids
     *
     * @return string|null
     */
    private function getTypeCondition(mixed $types = null)
    {
        $setCond = inSetCondition($types);
        if (is_null($setCond)) {
            return null;
        }

        return "type" . $setCond;
    }

    /**
     * Converts request object to transaction request parameters
     *
     * @param array $request
     * @param array $defaults array of default filter values
     * @param bool $throw if true then throws on error
     *
     * @return array
     */
    public function getRequestFilters(array $request, array $defaults = [], bool $throw = false)
    {
        $res = $defaults;

        // Type filter
        $typeFilter = [];
        if (isset($request["type"])) {
            $typeReq = asArray($request["type"]);
            foreach ($typeReq as $type_str) {
                $type_id = intval($type_str);
                if (!$type_id) {
                    $type_id = self::stringToType($type_str);
                }
                if (is_null($type_id) && $throw) {
                    throw new \Error("Invalid type '$type_str'");
                }
                if ($type_id) {
                    $typeFilter[] = $type_id;
                }
            }
            if (count($typeFilter) > 0) {
                $res["type"] = $typeFilter;
            }
        }

        // Accounts filter
        $accFilter = [];
        if (isset($request["accounts"])) {
            $accountsReq = asArray($request["accounts"]);
            foreach ($accountsReq as $accountId) {
                if ($this->accModel->isExist($accountId)) {
                    $accFilter[] = intval($accountId);
                } elseif ($throw) {
                    throw new \Error("Invalid account '$accountId'");
                }
            }
            if (count($accFilter) > 0) {
                $res["accounts"] = $accFilter;
            }
        }

        // Persons filter
        $personModel = PersonModel::getInstance();
        $personFilter = [];
        if (isset($request["persons"])) {
            $personsReq = asArray($request["persons"]);
            foreach ($personsReq as $personId) {
                if ($personModel->isExist($personId)) {
                    $personFilter[] = intval($personId);
                } elseif ($throw) {
                    throw new \Error("Invalid person '$personId'");
                }
            }
            if (count($personFilter) > 0) {
                $res["persons"] = $personFilter;
            }
        }

        // Categories filter
        $categoryFilter = [];
        if (isset($request["categories"])) {
            $categoriesReq = asArray($request["categories"]);
            foreach ($categoriesReq as $categoryId) {
                $category_id = intval($categoryId);
                if ($category_id === NO_CATEGORY || $this->catModel->isExist($categoryId)) {
                    $categoryFilter[] = $category_id;
                } elseif ($throw) {
                    throw new \Error("Invalid category '$categoryId'");
                }
            }
            if (count($categoryFilter) > 0) {
                $res["categories"] = $categoryFilter;
            }
        }

        // Search query
        if (isset($request["search"]) && !is_null($request["search"])) {
            $res["search"] = $request["search"];
        }

        // Date range filter
        if (isset($request["startDate"]) && !is_null($request["startDate"])) {
            $res["startDate"] = intval($request["startDate"]);
        }
        if (isset($request["endDate"]) && !is_null($request["endDate"])) {
            $res["endDate"] = intval($request["endDate"]);
        }

        // Page
        if (isset($request["page"])) {
            $page = intval($request["page"]);
            if ($page > 1) {
                $res["page"] = $page - 1;
            }
        }

        // Limit
        if (isset($request["onPage"])) {
            $onPage = intval($request["onPage"]);
            if ($onPage < 0 && $throw) {
                throw new \Error("Invalid page limit");
            }
            if ($onPage > 0) {
                $res["onPage"] = $onPage;
            }
        }

        // Pages range
        if (isset($request["range"])) {
            $range = intval($request["range"]);
            if ($range > 0) {
                $res["range"] = $range;
            }
        }

        return $res;
    }

    /**
     * Converts filter parameters to filter object
     *
     * @param array $params
     *
     * @return array
     */
    public function getFilterObject(array $params)
    {
        $res = [];

        // Type
        if (
            isset($params["type"]) &&
            is_array($params["type"]) &&
            count($params["type"]) > 0
        ) {
            $res["type"] = $params["type"];
        }

        // Accounts
        if (
            isset($params["accounts"]) &&
            is_array($params["accounts"]) &&
            count($params["accounts"]) > 0
        ) {
            $res["accounts"] = $params["accounts"];
        }

        // Persons
        if (
            isset($params["persons"]) &&
            is_array($params["persons"]) &&
            count($params["persons"]) > 0
        ) {
            $res["persons"] = $params["persons"];
        }

        // Categories
        if (
            isset($params["categories"]) &&
            is_array($params["categories"]) &&
            count($params["categories"]) > 0
        ) {
            $res["categories"] = $params["categories"];
        }

        // Date range
        if (isset($params["startDate"])) {
            $res["startDate"] = $params["startDate"];
        }
        if (isset($params["endDate"])) {
            $res["endDate"] = $params["endDate"];
        }

        // Search query
        if (isset($params["search"])) {
            $res["search"] = $params["search"];
        }

        return $res;
    }

    /**
     * Returns array of DB conditions
     *
     * @param array $params
     *
     * @return array
     */
    private function getDBCondition(array $params = [])
    {
        if (is_null($params)) {
            $params = [];
        }

        $res = ["user_id=" . self::$user_id];

        // Transaction type condition
        if (isset($params["type"])) {
            $typeCond = $this->getTypeCondition($params["type"]);
            if (!is_empty($typeCond)) {
                $res[] = $typeCond;
            }
        }

        $accountsToFilter = [];

        // Persons filter condition
        if (isset($params["persons"]) && !is_null($params["persons"])) {
            $personAccounts = $this->getPersonAccounts($params["persons"]);
            if (!is_null($personAccounts)) {
                $accountsToFilter = $personAccounts;
            }
        }

        // Accounts filter condition
        if (isset($params["accounts"]) && !is_null($params["accounts"])) {
            $userAccounts = $params["accounts"];
            if (!is_array($userAccounts)) {
                $userAccounts = [$userAccounts];
            }

            array_push($accountsToFilter, ...$userAccounts);
        }

        if (count($accountsToFilter) > 0) {
            $accCond = $this->getAccCondition($accountsToFilter);
            if (!is_empty($accCond)) {
                $res[] = $accCond;
            }
        }

        // Categories filter condition
        if (isset($params["categories"]) && !is_null($params["categories"])) {
            $categoriesSet = $this->getCategoriesSet($params["categories"]);
            if (is_array($categoriesSet) && count($categoriesSet) > 0) {
                $catCond = $this->getCategoryCondition($categoriesSet);
                if (!is_empty($catCond)) {
                    $res[] = $catCond;
                }
            }
        }

        // Search condition
        if (isset($params["search"]) && !is_null($params["search"])) {
            $sReq = $this->dbObj->escape(trim($params["search"]));
            if (!is_empty($sReq)) {
                $res[] = "comment LIKE '%" . $sReq . "%'";
            }
        }

        // Date range condition
        if (isset($params["startDate"]) && !is_null($params["startDate"])) {
            $startDate = date("Y-m-d H:i:s", $params["startDate"]);
            $res[] = "date >= " . qnull($startDate);
        }

        if (isset($params["endDate"]) && !is_null($params["endDate"])) {
            $endDate = date("Y-m-d H:i:s", $params["endDate"]);
            $res[] = "date <= " . qnull($endDate);
        }

        return $res;
    }

    /**
     * Returns array of transactions
     *
     * @param array $params array of options:
     *     - 'type' => (int|int[]) - type of transaction filter. Default is ALL
     *     - 'accounts' => (int|int[]) - array of accounts to filter by. Default is empty
     *     - 'persons' => (int|int[]) - array of persons to filter by. Default is empty
     *     - 'categories' => (int|int[]) - array of categories to filter by. Default is empty
     *     - 'search' => (string) - query string to search by comments. Default is empty
     *     - 'startDate' => (string) - start date of transactions filter. Default is empty
     *     - 'endDate' => (string) - end date of transactions filter. Default is empty
     *     - 'desc' => (bool) - sort result descending
     *     - 'onPage' => (int) - count of transactions per page.
     *     - 'page' => (int) - page to return. zero based
     *     - 'range' => (int) - count of pages to return. Default is 1
     *
     * @return TransactionItem[]
     */
    public function getData(array $params = [])
    {
        $res = [];

        if (!self::$user_id) {
            return $res;
        }

        $uMod = UserModel::getInstance();
        $uObj = $uMod->getItem(self::$user_id);
        if (!$uObj) {
            throw new \Error("User not found");
        }

        $owner_id = $uObj->owner_id;
        if (!$owner_id) {
            return $res;
        }

        $condArr = $this->getDBCondition($params);

        // Sort order condition
        $orderByDate = (isset($params["orderByDate"]) && $params["orderByDate"] == true);
        $isDesc = (isset($params["desc"]) && $params["desc"] == true);
        $orderAndLimit = "";
        if ($orderByDate) {
            $orderAndLimit .= "date " . (($isDesc == true) ? "DESC" : "ASC") . ", ";
        }
        $orderAndLimit .= "pos " . (($isDesc == true) ? "DESC" : "ASC");

        // Pagination conditions
        $onPage = isset($params["onPage"]) ? intval($params["onPage"]) : 0;
        if ($onPage > 0) {
            $pageNum = isset($params["page"]) ? intval($params["page"]) : 0;
            $pagesRange = isset($params["range"]) ? intval($params["range"]) : 1;
            if ($pagesRange < 1) {
                $pagesRange = 1;
            }

            $transCount = $this->dbObj->countQ($this->tbl_name, $condArr);

            $limitOffset = ($onPage * $pageNum);
            $limitRows = min($transCount - $limitOffset, $onPage * $pagesRange);

            $orderAndLimit .= " LIMIT " . $limitOffset . ", " . $limitRows;
        }

        $qResult = $this->dbObj->selectQ("*", $this->tbl_name, $condArr, null, $orderAndLimit);
        $rowCount = $this->dbObj->rowsCount($qResult);
        if (!$rowCount) {
            return $res;
        }

        while ($row = $this->dbObj->fetchRow($qResult)) {
            $trans = $this->rowToObj($row);
            unset($row);

            $res[] = $trans;
        }

        return $res;
    }

    /**
     * Returns total count of transactions for specified condition
     *
     * @param array $params
     *
     * @return int
     */
    public function getTransCount(array $params = [])
    {
        if (!self::$user_id) {
            return 0;
        }

        $condArr = $this->getDBCondition($params);

        return $this->dbObj->countQ($this->tbl_name, $condArr);
    }

    /**
     * Returns label for specified timestamp and group type
     *
     * @param mixed $dateInfo date info object
     *
     * @return string|null
     */
    protected function getLabel(mixed $dateInfo)
    {
        return $dateInfo["time"];
    }

    /**
     * Returns date info object for next date in specified group type
     *
     * @param mixed $dateInfo date info object
     * @param int $groupType group type
     *
     * @return array
     */
    protected function getNextDate(mixed $dateInfo, int $groupType)
    {
        if (!isset(self::$durationMap[$groupType])) {
            throw new \Error("Invalid group type");
        }

        $groupStart = getDateIntervalStart($dateInfo, $groupType);
        $date = new DateTime("@" . $groupStart["time"], new DateTimeZone('UTC'));
        $duration = "P1" . self::$durationMap[$groupType];

        $timestamp = $date->add(new DateInterval($duration))->getTimestamp();
        return getDateInfo($timestamp, $groupType);
    }

    /**
     * Returns timestamp start date of range for specified group type
     *
     * @param int $endTime timestamp
     * @param int $limit limit
     * @param int $groupType group type
     *
     * @return int
     */
    protected function getLimitStartDate(int $endTime, int $limit, int $groupType)
    {
        if (!isset(self::$durationMap[$groupType])) {
            throw new \Error("Invalid group type");
        }

        $date = new DateTime("@" . $endTime, new DateTimeZone('UTC'));
        $duration = "P" . $limit . self::$durationMap[$groupType];

        if ($groupType === GROUP_BY_MONTH || $groupType === GROUP_BY_YEAR) {
            $dateInfo = getDateInfo($endTime, $groupType);
            $month = ($groupType === GROUP_BY_YEAR) ? 1 : $dateInfo["info"]["mon"];
            $date->setDate($dateInfo["info"]["year"], $month, 1);
        }

        return $date->sub(new DateInterval($duration))->getTimestamp();
    }

    /**
     * Converts request object to histogram request parameters
     *
     * @param array $request
     *
     * @return \stdClass
     */
    public function getHistogramFilters(array $request)
    {
        $currModel = CurrencyModel::getInstance();

        $res = new \stdClass();

        // Report type
        $reportType = $request["report"] ?? DEFAULT_REPORT_TYPE;
        if (!is_string($reportType)) {
            throw new \Error("Invalid report type");
        }
        $reportType = strtolower($reportType);
        if (!in_array($reportType, self::$availReports)) {
            throw new \Error("Invalid report type");
        }

        $res->report = $reportType;

        // Transaction type
        $transactionType = $request["type"] ?? DEFAULT_TRANSACTION_TYPE;
        $transactionType = asArray($transactionType);

        $transTypes = [];
        foreach ($transactionType as $type) {
            $type = intval($type);
            if (!in_array($type, self::$availTypes)) {
                throw new \Error("Invalid transaction type");
            }
            $transTypes[] = $type;
        }
        $res->type = $transTypes;

        // Currency or account
        if ($reportType === "currency") {
            if (isset($request["curr_id"]) && is_numeric($request["curr_id"])) {
                $curr_id = intval($request["curr_id"]);
                if (!$currModel->isExist($curr_id)) {
                    throw new \Error("Currency not found");
                }
            } else { // try to get first currency
                $curr_id = $currModel->getIdByPos(0);
                if (!$curr_id) {
                    throw new \Error("No currencies available");
                }
            }
            $res->curr_id = $curr_id;
        } elseif ($reportType === "account") {
            $accountsFilter = [];
            if (isset($request["accounts"])) {
                $accountsReq = asArray($request["accounts"]);
                foreach ($accountsReq as $acc_id) {
                    if (!$this->accModel->isExist($acc_id)) {
                        throw new \Error("Invalid account '$acc_id'");
                    }

                    $accountsFilter[] = intval($acc_id);
                }
            }
            $res->accounts = $accountsFilter;
        } elseif ($reportType === "category") {
            $categoriesFilter = [];
            if (isset($request["categories"])) {
                $categoriesReq = asArray($request["categories"]);
                foreach ($categoriesReq as $category_id) {
                    $category_id = intval($category_id);
                    if ($category_id !== NO_CATEGORY && !$this->catModel->isExist($category_id)) {
                        throw new \Error("Invalid category '$category_id'");
                    }

                    $categoriesFilter[] = $category_id;
                }
            }
            $res->categories = $categoriesFilter;
        }

        // Group type
        if (isset($request["group"])) {
            $groupType = self::getHistogramGroupTypeByName($request["group"]);
            if ($groupType !== false) {
                $res->group = strtolower($request["group"]);
            }
        } else {
            $res->group = self::getHistogramGroupName(DEFAULT_GROUP_TYPE);
        }

        // Date range
        if (isset($request["startDate"])) {
            $res->startDate = $request["startDate"];
        }
        if (isset($request["endDate"])) {
            $res->endDate = $request["endDate"];
        }

        return $res;
    }

    /**
     * Returns series array of amounts and date of transactions for statistics histogram
     *
     * @param array $params
     *
     * @return \stdClass|null
     */
    public function getHistogramSeries(array $params = [])
    {
        $res = new \stdClass();
        $res->values = [];
        $res->series = [];

        $params = is_array($params) ? $params : [];
        $reportType = $params["report"];

        $accounts = [];
        $categories = [];
        $categoriesMap = [];
        $dataCategories = [];
        if ($reportType == "currency") {
            if (!isset($params["curr_id"])) {
                return $res;
            }

            $dataCategories = asArray($params["curr_id"]);
        } elseif ($reportType == "account") {
            if (!isset($params["accounts"])) {
                return $res;
            }

            $accounts = asArray($params["accounts"]);
            if (count($accounts) === 0) {
                return $res;
            }
            $dataCategories = $accounts;
        } elseif ($reportType == "category") {
            if (isset($params["categories"])) {
                $categories = asArray($params["categories"]);
            }
            if (count($categories) === 0) {
                $mainCategories = $this->catModel->getData([
                    "parent_id" => NO_CATEGORY,
                    "returnIds" => true,
                ]);
                $categories = [NO_CATEGORY, ...$mainCategories];
            }

            $dataCategories = $categories;
            foreach ($dataCategories as $id) {
                $categoriesMap[] = $this->getCategoriesSet($id);
            }
        }

        $amountArr = [];
        $groupArr = [];
        $sumDate = null;
        $curDate = null;
        $groupStart = null;
        $curSum = [];

        $typesReq = (isset($params["type"])) ? $params["type"] : DEFAULT_TRANSACTION_TYPE;
        $typesReq = asArray($typesReq);

        $transTypes = [];
        foreach ($typesReq as $type) {
            $intType = intval($type);
            if (!$intType) {
                return null;
            }

            $transTypes[] = $intType;
            $amountArr[$intType] = [];
            $curSum[$intType] = [];
            foreach ($dataCategories as $category) {
                $amountArr[$intType][$category] = [];
                $curSum[$intType][$category] = 0.0;
            }
        }

        $group_type = (isset($params["group"])) ? intval($params["group"]) : DEFAULT_GROUP_TYPE;
        $limit = (isset($params["limit"])) ? intval($params["limit"]) : 0;
        if (!self::$user_id || !count($transTypes)) {
            return null;
        }

        // Prepare transactions list request
        $dataParams = [
            "type" => $transTypes,
            "orderByDate" => true,
        ];
        if (count($accounts) > 0) {
            $dataParams["accounts"] = $accounts;
        }
        if (count($categories) > 0) {
            $dataParams["categories"] = $categories;
        }

        if (isset($params["startDate"]) && !is_null($params["startDate"])) {
            $dataParams["startDate"] = $params["startDate"];
        }
        if (isset($params["endDate"]) && !is_null($params["endDate"])) {
            $dataParams["endDate"] = $params["endDate"];
        }

        if ($limit > 0) {
            $endTime = $dataParams["endDate"] ?? time();
            $dataParams["startDate"] = $this->getLimitStartDate($endTime, $limit, $group_type);
            $dataParams["endDate"] = $endTime;
        }

        $items = $this->getData($dataParams);
        foreach ($items as $item) {
            if (!in_array($item->type, $transTypes)) {
                continue;
            }

            $category = null;
            $isSource = true;
            if ($reportType == "currency") {
                $isSource = ($item->type == EXPENSE);
                $itemCurrency = ($isSource) ? $item->src_curr : $item->dest_curr;
                if (in_array($itemCurrency, $dataCategories)) {
                    $category = $itemCurrency;
                }
            } elseif ($reportType == "account") {
                if (in_array($item->src_id, $dataCategories)) {
                    $category = $item->src_id;
                } elseif (in_array($item->dest_id, $dataCategories)) {
                    $category = $item->dest_id;
                    $isSource = false;
                }
            } elseif ($reportType == "category") {
                foreach ($categoriesMap as $categoryIds) {
                    if (in_array($item->category_id, $categoryIds)) {
                        $category = $categoryIds[0];
                        break;
                    }
                }
            }

            if (is_null($category)) {
                continue;
            }

            $dateInfo = getDateInfo($item->date, $group_type);
            $amount = ($isSource) ? $item->src_amount : $item->dest_amount;
            $curDate = $dateInfo;

            if (is_null($sumDate)) {        // first iteration
                $groupStart = getDateIntervalStart($curDate, $group_type);
                $sumDate = $curDate;
            } elseif (is_array($sumDate) && $sumDate["id"] != $curDate["id"]) {
                $dateDiff = getDateDiff($sumDate, $curDate, $group_type);

                foreach ($transTypes as $type) {
                    foreach ($dataCategories as $cat) {
                        $amountArr[$type][$cat][] = $curSum[$type][$cat];
                        $curSum[$type][$cat] = 0.0;
                        // Append empty values after saved value
                        for ($i = 1; $i < $dateDiff; $i++) {
                            $amountArr[$type][$cat][] = 0;
                        }
                    }
                }

                $label = $this->getLabel($groupStart);
                $groupArr[] = [$label, 1];
                // Append series for empty values
                $groupDate = $groupStart;
                for ($i = 1; $i < $dateDiff; $i++) {
                    $groupDate = $this->getNextDate($groupDate, $group_type);
                    $label = $this->getLabel($groupDate);
                    $groupArr[] = [$label, 1];
                }

                $sumDate = $curDate;
                $groupStart = getDateIntervalStart($sumDate, $group_type);
            }

            $curSum[$item->type][$category] = normalize($curSum[$item->type][$category] + $amount);
        }

        // save remain value
        $remainSum = 0;
        foreach ($transTypes as $type) {
            $remainSum += array_sum($curSum[$type]);
        }
        if ($remainSum != 0.0 && is_array($groupStart)) {
            foreach ($transTypes as $type) {
                foreach ($dataCategories as $cat) {
                    $amountArr[$type][$cat][] = $curSum[$type][$cat];
                }
            }

            $label = $this->getLabel($groupStart);
            $groupArr[] = [$label, 1];
        }

        // Flatten arrays of values
        $dataSets = [];
        foreach ($amountArr as $type => $typeCategories) {
            foreach ($typeCategories as $typeCategory => $values) {
                $dataSets[] = [
                    "group" => $type,
                    "category" => $typeCategory,
                    "data" => $values,
                ];
            }
        }

        if ($limit > 0) {
            $amountCount = 0;
            foreach ($dataSets as $dataSet) {
                $amountCount = max(count($dataSet["data"]), $amountCount);
            }
            $limitCount = min($amountCount, $limit);

            foreach ($dataSets as $index => $dataSet) {
                $dataSets[$index]["data"] = array_slice($dataSet["data"], -$limitCount);
            }

            $newGroupsCount = 0;
            $groupLimit = 0;
            $firstSerieSize = 0;
            $i = count($groupArr) - 1;
            while ($i >= 0 && $groupLimit < $limitCount) {
                $firstSerieSize = $limitCount - $groupLimit;
                $groupLimit += $groupArr[$i][1];

                $newGroupsCount++;
                $i--;
            }

            $groupArr = array_slice($groupArr, -$newGroupsCount);
            if (count($groupArr) > 0) {
                $groupArr[0][1] = $firstSerieSize;
            }
        }

        $res = new \stdClass();
        $res->values = $dataSets;
        $res->series = $groupArr;

        return $res;
    }

    /**
     * Returns transaction type for specified string
     *
     * @param string $value transaction type string
     *
     * @return int
     */
    public static function stringToType(string $value)
    {
        $stringTypes = [
            "expense" => EXPENSE,
            "income" => INCOME,
            "transfer" => TRANSFER,
            "debt" => DEBT,
            "limit" => LIMIT_CHANGE,
        ];

        if (!is_string($value) || $value === "" || !isset($stringTypes[$value])) {
            return 0;
        }

        return $stringTypes[$value];
    }

    /**
     * Returns string for specified transaction type
     *
     * @param int $trans_type transaction type
     *
     * @return string|null
     */
    public static function typeToString(int $trans_type)
    {
        $typeNames = self::getTypeNames();
        if (!isset($typeNames[$trans_type])) {
            return null;
        }

        return $typeNames[$trans_type];
    }

    /**
     * Return array of names of available transaction types
     *
     * @return array
     */
    public static function getTypeNames()
    {
        return [
            EXPENSE => __("TR_EXPENSE"),
            INCOME => __("TR_INCOME"),
            TRANSFER => __("TR_TRANSFER"),
            DEBT => __("TR_DEBT"),
            LIMIT_CHANGE => __("TR_LIMIT_CHANGE"),
        ];
    }

    /**
     * Returns name of specified group type
     *
     * @param int $groupType
     *
     * @return string|null
     */
    public static function getHistogramGroupName(int $groupType)
    {
        if (!isset(self::$availGroupTypes[$groupType])) {
            return null;
        }

        return self::$availGroupTypes[$groupType];
    }

    /**
     * Returns group type for specified group name
     *
     * @param string $name group name
     *
     * @return int|false
     */
    public static function getHistogramGroupTypeByName(string $name)
    {
        $lname = strtolower($name);
        foreach (self::$availGroupTypes as $groupType => $groupName) {
            if ($lname == strtolower($groupName)) {
                return $groupType;
            }
        }

        return false;
    }

    /**
     * Returns array of histogram group types
     *
     * @return array
     */
    public static function getHistogramGroupTypes()
    {
        return [
            GROUP_BY_DAY => [
                "name" => self::getHistogramGroupName(GROUP_BY_DAY),
                "title" => __("STAT_GROUP_BY_DAY"),
            ],
            GROUP_BY_WEEK => [
                "name" => self::getHistogramGroupName(GROUP_BY_WEEK),
                "title" => __("STAT_GROUP_BY_WEEK"),
            ],
            GROUP_BY_MONTH => [
                "name" => self::getHistogramGroupName(GROUP_BY_MONTH),
                "title" => __("STAT_GROUP_BY_MONTH"),
            ],
            GROUP_BY_YEAR => [
                "name" => self::getHistogramGroupName(GROUP_BY_YEAR),
                "title" => __("STAT_GROUP_BY_YEAR"),
            ],
        ];
    }

    /**
     * Returns array of available histogram report types
     *
     * @return array
     */
    public static function getHistogramReportTypes()
    {
        return self::$availReports;
    }
}
