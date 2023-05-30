<?php

namespace JezveMoney\App\Model;

use JezveMoney\App\Item\ScheduledTransactionItem;
use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;

use function JezveMoney\Core\inSetCondition;

/**
 * Scheduled transactions model
 */
class ScheduledTransactionModel extends CachedTable
{
    use Singleton;

    public static $availIntervals = [
        INTERVAL_NONE,
        INTERVAL_DAY,
        INTERVAL_WEEK,
        INTERVAL_MONTH,
        INTERVAL_YEAR,
    ];

    protected static $user_id = 0;
    protected static $owner_id = 0;

    protected $tbl_name = "scheduled_transactions";
    protected $accModel = null;
    protected $currMod = null;
    protected $catModel = null;
    protected $reminderModel = null;
    protected $affectedItems = null;
    protected $remindersChanged = false;

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
        $this->reminderModel = ReminderModel::getInstance();
        TransactionModel::getInstance();
    }

    /**
     * Converts table row from database to object
     *
     * @param array|null $row array of table row fields
     *
     * @return ScheduledTransactionItem|null
     */
    protected function rowToObj(?array $row)
    {
        return ScheduledTransactionItem::fromTableRow($row);
    }

    /**
     * Returns data query object for CachedTable::updateCache()
     *
     * @return \mysqli_result|bool
     */
    protected function dataQuery()
    {
        return $this->dbObj->selectQ("*", $this->tbl_name, "user_id=" . self::$user_id);
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
            "category_id",
            "comment",
            "start_date",
            "end_date",
            "interval_type",
            "interval_step",
            "interval_offset",
        ];
        $res = [];

        // In CREATE mode all fields is required
        if (!$item_id) {
            checkFields($params, $avFields, true);
        }
        $item = ($item_id) ? $this->getItem($item_id) : null;

        if (isset($params["type"])) {
            $res["type"] = intval($params["type"]);
            if (!in_array($res["type"], TransactionModel::$availTypes)) {
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
                ($res["src_id"] && !in_array($res["type"], TransactionModel::$srcAvailTypes)) ||
                (!$res["src_id"] && in_array($res["type"], TransactionModel::$srcMandatoryTypes))
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
                ($res["dest_id"] && !in_array($res["type"], TransactionModel::$destAvailTypes)) ||
                (!$res["dest_id"] && in_array($res["type"], TransactionModel::$destMandatoryTypes))
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

        if ($res["type"] == DEBT) {
            if (
                $srcAcc
                && $srcAcc->owner_id !== self::$owner_id
                && $destAcc
                && $destAcc->owner_id !== self::$owner_id
            ) {
                throw new \Error("Both source and destination are accounts of person");
            }

            if (
                (!$srcAcc || $srcAcc->owner_id === self::$owner_id)
                && (!$destAcc || $destAcc->owner_id === self::$owner_id)
            ) {
                throw new \Error("Neither source nor destination are accounts of person");
            }
        }

        if (array_key_exists("start_date", $params)) {
            $res["start_date"] = intval($params["start_date"]);
            if (!$res["start_date"]) {
                throw new \Error("Invalid start date specified");
            }
        } else {
            $res["start_date"] = $item->start_date;
        }

        if (array_key_exists("end_date", $params)) {
            $res["end_date"] = ($params["end_date"]) ? intval($params["end_date"]) : null;
            if (!is_null($res["end_date"]) && $res["end_date"] < $res["start_date"]) {
                throw new \Error("Invalid end date specified");
            }
        }

        if (isset($params["comment"])) {
            $res["comment"] = $this->dbObj->escape($params["comment"]);
        }

        if (isset($params["interval_type"])) {
            $res["interval_type"] = $this->validateIntervalType($params["interval_type"]);
        } else {
            $res["interval_type"] = $item->interval_type;
        }

        if (isset($params["interval_step"])) {
            $res["interval_step"] = intval($params["interval_step"]);
            if ($res["interval_step"] < 0) {
                throw new \Error("Invalid interval step specified");
            }
        }

        if (isset($params["interval_offset"])) {
            $res["interval_offset"] = $this->validateIntervalOffset(
                $params["interval_offset"],
                $res["interval_type"],
            );
        }

        return $res;
    }

    /**
     * Validates interval type value
     *
     * @param mixed $value
     *
     * @return int
     */
    protected function validateIntervalType(mixed $value)
    {
        $type = intval($value);
        if (!in_array($type, self::$availIntervals)) {
            throw new \Error("Invalid interval type specified");
        }

        return $type;
    }

    /**
     * Validates offset value for specified interval type
     *
     * @param mixed $value
     * @param int $type
     *
     * @return int
     */
    protected function validateIntervalOffset(mixed $value, int $type)
    {
        $offset = intval($value);

        $this->validateIntervalType($type);

        if ($type === INTERVAL_NONE) {
            if ($offset !== 0) {
                throw new \Error("Invalid interval offset specified");
            }
        } elseif ($type === INTERVAL_DAY) {
            if ($offset !== 0) {
                throw new \Error("Invalid offset for day interval specified");
            }
        } elseif ($type === INTERVAL_WEEK) {
            if ($offset < 0 || $offset >= DAYS_IN_WEEK) {
                throw new \Error("Invalid offset for week interval specified");
            }
        } elseif ($type === INTERVAL_MONTH) {
            if ($offset < 0 || $offset >= MAX_DAYS_IN_MONTH) {
                throw new \Error("Invalid offset for month interval specified");
            }
        } elseif ($type === INTERVAL_YEAR) {
            $monthIndex = intval($offset / 100);
            $dayIndex = ($offset % 100);
            if (
                $monthIndex < 0
                || $monthIndex >= MONTHS_IN_YEAR
                || $dayIndex < 0
                || $dayIndex >= MAX_DAYS_IN_MONTH
            ) {
                throw new \Error("Invalid offset for year interval specified");
            }
        }

        return $offset;
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
            "category_id",
            "comment",
            "start_date",
            "end_date",
            "interval_type",
            "interval_step",
            "interval_offset",
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

        $res["category_id"] = $params["category_id"];
        $res["comment"] = $params["comment"];

        $res["start_date"] = $params["start_date"];
        $res["end_date"] = $params["end_date"];
        $res["interval_type"] = $params["interval_type"];
        $res["interval_step"] = $params["interval_step"];
        $res["interval_offset"] = $params["interval_offset"];

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
            !isset($this->affectedItems) ||
            !is_array($this->affectedItems) ||
            !count($this->affectedItems)
        ) {
            return false;
        }

        $curDate = date("Y-m-d H:i:s");

        foreach ($this->affectedItems as $item_id => $item) {
            $item = (array)$item;

            $res = $this->validateParams($item);

            $res["start_date"] = date("Y-m-d H:i:s", $item["start_date"]);
            $res["end_date"] = ($item["end_date"]) ? date("Y-m-d H:i:s", $item["end_date"]) : null;

            if (is_string($item["createdate"])) {
                $res["createdate"] = $item["createdate"];
            } else {
                $res["createdate"] = date("Y-m-d H:i:s", $item["createdate"]);
            }

            $res["updatedate"] = $curDate;
            $res["user_id"] = self::$user_id;
            $res["id"] = $item["id"];

            $this->affectedItems[$item_id] = $res;
        }

        $updResult = $this->dbObj->updateMultipleQ($this->tbl_name, $this->affectedItems);
        $this->affectedItems = null;

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
            is_null($this->affectedItems) ||
            !is_array($this->affectedItems) ||
            !isset($this->affectedItems[$item->id])
        ) {
            return $item;
        }

        return $this->affectedItems[$item->id];
    }

    /**
     * Add item to the affected list
     *
     * @param mixed $item scheduled transaction object
     *
     * @return bool
     */
    protected function pushAffected(mixed $item)
    {
        if (!$item || !$item->id) {
            return false;
        }

        if (is_null($this->affectedItems)) {
            $this->affectedItems = [];
        }

        $this->affectedItems[$item->id] = $item;

        return true;
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
        $res["start_date"] = date("Y-m-d H:i:s", $res["start_date"]);
        $res["end_date"] = ($res["end_date"]) ? date("Y-m-d H:i:s", $res["end_date"]) : null;
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

        foreach ($items as $item_id) {
            $this->createReminders($item_id);
        }

        return true;
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

        $this->remindersChanged = (
            ($res["start_date"] !== $item->start_date)
            || (isset($res["end_date"]) && $res["end_date"] !== $item->end_date)
            || (isset($res["interval_type"]) && $res["interval_type"] !== $item->interval_type)
            || (isset($res["interval_step"]) && $res["interval_step"] !== $item->interval_step)
            || (isset($res["interval_offset"]) && $res["interval_offset"] !== $item->interval_offset)
        );

        $res["start_date"] = date("Y-m-d H:i:s", $res["start_date"]);
        if (isset($res["end_date"])) {
            $res["end_date"] = date("Y-m-d H:i:s", $res["end_date"]);
        }
        $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }

    /**
     * Performs model-specific actions after update successfully completed
     *
     * @param int $item_id item id
     *
     * @return bool
     */
    protected function postUpdate(int $item_id)
    {
        $this->cleanCache();

        if ($this->remindersChanged) {
            $this->updateReminders($item_id);
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
        foreach ($items as $item_id) {
            // check item is exist
            $itemObj = $this->getItem($item_id);
            if (!$itemObj) {
                return false;
            }

            $this->deleteReminders($item_id);
        }

        return true;
    }

    /**
     * Removes all scheduled transactions
     *
     * @return bool
     */
    public function reset()
    {
        if (!self::$user_id) {
            return false;
        }

        $this->reminderModel->reset();

        $condArr = ["user_id=" . self::$user_id];
        if (!$this->dbObj->deleteQ($this->tbl_name, $condArr)) {
            return false;
        }

        $this->cleanCache();

        return true;
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
     * Returns array of scheduled transactions
     *
     * @param array $params array of options:
     *
     * @return ScheduledTransactionItem[]
     */
    public function getData(array $params = [])
    {
        $res = [];

        if (!$this->checkCache()) {
            return $res;
        }

        $items = $this->cache;

        $onPage = isset($params["onPage"]) ? intval($params["onPage"]) : 0;
        if ($onPage > 0) {
            $pageNum = isset($params["page"]) ? intval($params["page"]) : 0;
            $pagesRange = isset($params["range"]) ? intval($params["range"]) : 1;
            if ($pagesRange < 1) {
                $pagesRange = 1;
            }

            $itemsCount = $this->getCount();

            $limitOffset = ($onPage * $pageNum);
            $limitRows = min($itemsCount - $limitOffset, $onPage * $pagesRange);

            $items = array_slice($this->cache, $limitOffset, $limitRows);
        }

        foreach ($items as $item) {
            $res[] = $item;
        }

        return $res;
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
     * Updates scheduled transactions with removed categories
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
     * Creates reminders for specified scheduled transaction
     *
     * @param int $item_id scheduled transaction id
     *
     * @return bool
     */
    protected function createReminders(int $item_id)
    {
        $item = $this->getItem($item_id);
        if (!$item) {
            throw new \Error("Item not found");
        }

        $settingsModel = UserSettingsModel::getInstance();

        $reminderDates = $item->getReminders([
            "endDate" => $settingsModel->getClientTime(),
        ]);
        if (count($reminderDates) === 0) {
            return true;
        }

        $reminders = [];
        foreach ($reminderDates as $date) {
            $reminders[] = [
                "schedule_id" => $item_id,
                "state" => REMINDER_SCHEDULED,
                "date" => $date,
                "transaction_id" => 0,
            ];
        }

        $this->reminderModel->createMultiple($reminders);

        return true;
    }

    /**
     * Updates reminders of specified scheduled transaction
     *
     * @param int $item_id scheduled transaction id
     *
     * @return bool
     */
    protected function updateReminders(int $item_id)
    {
        $this->deleteReminders($item_id);
        return $this->createReminders($item_id);
    }

    /**
     * Removes reminders of specified scheduled transaction
     *
     * @param int $item_id scheduled transaction id
     *
     * @return bool
     */
    protected function deleteReminders(int $item_id)
    {
        return $this->reminderModel->deleteRemindersBySchedule($item_id);
    }
}
