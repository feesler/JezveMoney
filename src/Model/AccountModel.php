<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\App\Item\AccountItem;

use function JezveMoney\Core\inSetCondition;

define("ACCOUNT_HIDDEN", 1);

define("ACCOUNT_TYPE_OTHER", 0);
define("ACCOUNT_TYPE_CASH", 1);
define("ACCOUNT_TYPE_DEBIT_CARD", 2);
define("ACCOUNT_TYPE_CREDIT_CARD", 3);
define("ACCOUNT_TYPE_CREDIT", 4);
define("ACCOUNT_TYPE_DEPOSIT", 5);

/**
 * Accounts model
 */
class AccountModel extends CachedTable
{
    use Singleton;

    private static $user_id = 0;
    private static $owner_id = 0;

    private static $availTypes = [
        ACCOUNT_TYPE_OTHER,
        ACCOUNT_TYPE_CASH,
        ACCOUNT_TYPE_DEBIT_CARD,
        ACCOUNT_TYPE_CREDIT_CARD,
        ACCOUNT_TYPE_CREDIT,
        ACCOUNT_TYPE_DEPOSIT,
    ];

    protected $tbl_name = "accounts";
    protected $currMod = null;
    protected $personMod = null;
    protected $iconModel = null;
    protected $currencyUpdated = false;
    protected $balanceUpdated = false;
    protected $removedItems = null;
    protected $latestPos = null;

    /**
     * Model initialization
     */
    protected function onStart()
    {
        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();
        self::$owner_id = $uMod->getOwner();

        $this->dbObj = MySqlDB::getInstance();

        $this->currMod = CurrencyModel::getInstance();
        $this->personMod = PersonModel::getInstance();
        $this->iconModel = IconModel::getInstance();
    }

    /**
     * Converts table row from database to object
     *
     * @param array|null $row
     *
     * @return AccountItem|null
     */
    protected function rowToObj(?array $row)
    {
        return AccountItem::fromTableRow($row);
    }

    /**
     * Returns data query object for CachedTable::updateCache()
     *
     * @return \mysqli_result|bool
     */
    protected function dataQuery()
    {
        return $this->dbObj->selectQ("*", $this->tbl_name, "user_id=" . self::$user_id, null, "id ASC");
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
        $avFields = ["owner_id", "type", "name", "initbalance", "limit", "curr_id", "icon_id", "flags"];
        $res = [];

        // In CREATE mode all fields is required
        if (!$item_id) {
            checkFields($params, $avFields, true);
        }

        if (isset($params["owner_id"])) {
            $res["owner_id"] = intval($params["owner_id"]);
            if (!$res["owner_id"]) {
                throw new \Error("Invalid owner_id specified");
            }
        }

        if (isset($params["type"])) {
            $res["type"] = intval($params["type"]);
            if (!in_array($res["type"], self::$availTypes)) {
                throw new \Error("Invalid type specified");
            }
        }

        if (isset($params["name"])) {
            $res["name"] = $this->dbObj->escape($params["name"]);
            if (is_empty($res["name"])) {
                throw new \Error("Invalid name specified");
            }
        }

        if (isset($params["initbalance"])) {
            $res["initbalance"] = floatval($params["initbalance"]);
        }

        if (isset($params["limit"])) {
            $res["limit"] = floatval($params["limit"]);
        }

        if (isset($params["curr_id"])) {
            $res["curr_id"] = intval($params["curr_id"]);
            if (!$this->currMod->isExist($res["curr_id"])) {
                throw new \Error("Invalid curr_id specified");
            }
        }

        if (isset($params["icon_id"])) {
            $res["icon_id"] = intval($params["icon_id"]);
            if ($res["icon_id"] != 0 && !$this->iconModel->isExist($res["icon_id"])) {
                throw new \Error("Invalid icon_id specified");
            }
        }

        if (isset($params["flags"])) {
            $res["flags"] = intval($params["flags"]);
        }

        if ($this->isSameItemExist($res, $item_id)) {
            throw new \Error("Same account already exist");
        }

        return $res;
    }

    /**
     * Checks same item already exist
     *
     * @param array $params item fields
     * @param int $item_id item id
     *
     * @return bool
     */
    protected function isSameItemExist(array $params, int $item_id = 0)
    {
        if (!is_array($params) || !isset($params["name"])) {
            return false;
        }

        $foundItem = $this->findByName($params["name"]);
        return ($foundItem && $foundItem->id != $item_id);
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

        if (is_null($this->latestPos)) {
            $this->latestPos = $this->getLatestPos();
        }
        $this->latestPos++;

        $res["pos"] = $this->latestPos;
        $res["balance"] = $res["initbalance"];
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
        $this->cleanCache();
        $this->latestPos = null;

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

        $this->currencyUpdated = (isset($res["curr_id"]) && $res["curr_id"] != $item->curr_id);

        $currObj = $this->currMod->getItem($res["curr_id"] ?? $item->curr_id);
        if (!$currObj) {
            throw new \Error("Currency not found");
        }

        // get initial balance to calc difference
        $diff = normalize($res["initbalance"] - $item->initbalance, $currObj->precision);
        $minDiff = pow(0.1, $currObj->precision);
        if (abs($diff) >= $minDiff) {
            $this->balanceUpdated = true;
            $res["balance"] = normalize($item->balance + $diff, $currObj->precision);
        } else {
            $this->balanceUpdated = false;
            unset($res["balance"]);
            unset($res["initbalance"]);
        }

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
    protected function postUpdate(int $item_id)
    {
        $this->cleanCache();

        if ($this->currencyUpdated || $this->balanceUpdated) {
            $transMod = TransactionModel::getInstance();

            $transMod->onAccountUpdate($item_id);
        }

        $this->currencyUpdated = false;
        $this->balanceUpdated = false;

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
        $this->removedItems = [];

        foreach ($items as $item_id) {
            // check account is exist
            $accObj = $this->getItem($item_id);
            if (!$accObj) {
                return false;
            }

            // check user of account
            if ($accObj->user_id != self::$user_id) {
                return false;
            }

            $this->removedItems[] = $accObj;
        }

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
        $this->cleanCache();

        $transMod = TransactionModel::getInstance();
        $ruleModel = ImportRuleModel::getInstance();
        $tplModel = ImportTemplateModel::getInstance();

        $res = $transMod->onAccountDelete($this->removedItems)
            && $ruleModel->onAccountDelete($items)
            && $tplModel->onAccountDelete($items);
        $this->removedItems = null;

        return $res;
    }

    /**
     * Shows or hides specified accounts
     *
     * @param array|int|null $items id or array of account ids to show/hide
     * @param bool $val show if true, hide otherwise
     *
     * @return bool
     */
    public function show(mixed $items, bool $val = true)
    {
        $items = asArray($items);

        foreach ($items as $item_id) {
            // check account is exist
            $accObj = $this->getItem($item_id);
            if (!$accObj) {
                return false;
            }

            // check user of account
            if ($accObj->user_id != self::$user_id) {
                return false;
            }
        }

        if ($val) {
            $condition = ["flags=flags&~" . ACCOUNT_HIDDEN];
        } else {
            $condition = ["flags=flags|" . ACCOUNT_HIDDEN];
        }

        $updRes = $this->dbObj->updateQ($this->tbl_name, $condition, "id" . inSetCondition($items));
        if (!$updRes) {
            return false;
        }

        $this->cleanCache();

        return true;
    }

    /**
     * Hides specified accounts
     *
     * @param int|int[]|null $items id or array of account ids to hide
     *
     * @return bool
     */
    public function hide(mixed $items)
    {
        return $this->show($items, false);
    }

    /**
     * Checks item with specified position is exists
     *
     * @param int $position position
     *
     * @return bool
     */
    public function isPosExist(int $position)
    {
        $pos = intval($position);

        if (!$this->checkCache()) {
            return false;
        }

        foreach ($this->cache as $item) {
            if ($item->pos == $pos) {
                return true;
            }
        }

        return false;
    }

    /**
     * Returns latest position of accounts
     *
     * @return int
     */
    public function getLatestPos()
    {
        if (!$this->checkCache()) {
            return 0;
        }

        $res = 0;
        foreach ($this->cache as $item) {
            $res = max($item->pos, $res);
        }

        return $res;
    }

    /**
     * Updates position of item
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
        if (!$item_id || !$new_pos) {
            return false;
        }

        $item = $this->getItem($item_id);
        if (!$item || $item->user_id != self::$user_id) {
            return false;
        }

        $old_pos = $item->pos;
        if ($old_pos == $new_pos) {
            return true;
        }

        if ($this->isPosExist($new_pos)) {
            $updRes = false;
            if ($old_pos == 0) {           // insert with specified position
                $updRes = $this->dbObj->updateQ(
                    $this->tbl_name,
                    ["pos=pos+1"],
                    ["user_id=" . self::$user_id, "pos >= $new_pos"],
                );
            } elseif ($new_pos < $old_pos) {       // moving up
                $updRes = $this->dbObj->updateQ(
                    $this->tbl_name,
                    ["pos=pos+1"],
                    ["user_id=" . self::$user_id, "pos >= $new_pos", "pos < $old_pos"],
                );
            } elseif ($new_pos > $old_pos) {        // moving down
                $updRes = $this->dbObj->updateQ(
                    $this->tbl_name,
                    ["pos=pos-1"],
                    ["user_id=" . self::$user_id, "pos > $old_pos", "pos <= $new_pos"],
                );
            }
            if (!$updRes) {
                return false;
            }
        }

        if (!$this->dbObj->updateQ($this->tbl_name, ["pos" => $new_pos], "id=" . $item_id)) {
            return false;
        }

        $this->cleanCache();

        return true;
    }

    /**
     * Returns account of person with specified currency if exist
     *
     * @param int $person_id person id
     * @param int $curr_id currency id
     *
     * @return object|null
     */
    public function getPersonAccount(int $person_id, int $curr_id)
    {
        $person_id = intval($person_id);
        if ($person_id == self::$owner_id || !$this->personMod->isExist($person_id)) {
            wlog("Invalid person specified");
            return null;
        }

        $curr_id = intval($curr_id);
        if (!$this->currMod->isExist($curr_id)) {
            wlog("Invalid currency specified");
            return null;
        }

        if (!$this->checkCache()) {
            return null;
        }

        foreach ($this->cache as $item) {
            if ($item->owner_id == $person_id && $item->curr_id == $curr_id) {
                return $item;
            }
        }

        return null;
    }

    /**
     * Creates account with specified currency for person
     *
     * @param int $person_id person id
     * @param int $curr_id currency id
     *
     * @return object|null
     */
    public function createPersonAccount(int $person_id, int $curr_id)
    {
        $person_id = intval($person_id);
        if ($person_id == self::$owner_id || !$this->personMod->isExist($person_id)) {
            wlog("Invalid person specified");
            return null;
        }

        $curr_id = intval($curr_id);
        if (!$curr_id) {
            wlog("Invalid currency specified");
            return null;
        }

        $createRes = $this->create([
            "type" => 0,
            "owner_id" => $person_id,
            "name" => "acc_" . $person_id . "_" . $curr_id,
            "initbalance" => 0.0,
            "limit" => 0,
            "curr_id" => $curr_id,
            "icon_id" => 0,
            "flags" => 0
        ]);

        return $this->getItem($createRes);
    }

    /**
     * Handles person(s) delete event
     * Removes accounts of removed person(s)
     *
     * @param mixed $persons id or array of removed person ids
     *
     * @return bool
     */
    public function onPersonDelete(mixed $persons)
    {
        if (is_null($persons)) {
            return false;
        }
        $persons = asArray($persons);

        if (!$this->checkCache()) {
            return false;
        }

        $accToDel = [];
        foreach ($this->cache as $acc_id => $item) {
            if (in_array($item->owner_id, $persons)) {
                $accToDel[] = $acc_id;
            }
        }

        return $this->del($accToDel);
    }

    /**
     * Removes all accounts of user
     *
     * @param array $params array of options:
     *     - 'deletePersons' => (bool) - remove person accounts flag, default is true
     *     - 'users' => (int|array) - id or array of user ids to reset accounts, admin only
     *
     * @return bool
     */
    public function reset(array $params = [])
    {
        if (!$this->checkCache()) {
            return false;
        }

        $users = isset($params["users"]) ? $params["users"] : null;
        $deletePersons = isset($params["deletePersons"]) ? $params["deletePersons"] : true;

        if (is_null($users)) {
            $users = self::$user_id;
        }
        $users = asArray($users);

        // Normal user may reset only self data
        if (!UserModel::isAdminUser() && (count($users) != 1 || $users[0] != self::$user_id)) {
            return false;
        }

        $setCond = inSetCondition($users);
        if (is_null($setCond)) {
            return true;
        }
        $condArr = ["user_id" . $setCond];

        // delete import rules
        $reqOwner = ($deletePersons) ? "all" : "user";
        $userAccounts = $this->getData(["owner" => $reqOwner, "visibility" => "all"]);
        $accountsToDelete = [];
        foreach ($userAccounts as $account) {
            $accountsToDelete[] = $account->id;
        }

        $ruleModel = ImportRuleModel::getInstance();
        $ruleModel->onAccountDelete($accountsToDelete);

        $tplModel = ImportTemplateModel::getInstance();
        $tplModel->onAccountDelete($accountsToDelete);

        // if delete person accounts, then delete all transactions
        if ($deletePersons) {
            if (!$this->dbObj->deleteQ("transactions", $condArr)) {
                return false;
            }
        } else {
            $transMod = TransactionModel::getInstance();
            $res = $transMod->onAccountDelete($userAccounts);
            if (!$res) {
                return false;
            }

            $condArr[] = "id" . inSetCondition($accountsToDelete);
        }

        // delete accounts
        if (!$this->dbObj->deleteQ($this->tbl_name, $condArr)) {
            return false;
        }

        $this->cleanCache();

        return true;
    }

    /**
     * Sets balance of account
     *
     * @param int $acc_id account id
     * @param float $balance new balance value
     * @param float|null $limit optional new credit limit value
     *
     * @return bool
     */
    public function setBalance(int $acc_id, float $balance, ?float $limit = null)
    {
        $accObj = $this->getItem($acc_id);
        if (!$accObj) {
            return false;
        }

        $data = ["balance" => $balance];
        if (!is_null($limit)) {
            $data["limit"] = $limit;
        }

        if (!$this->dbObj->updateQ($this->tbl_name, $data, "id=" . $acc_id)) {
            return false;
        }

        $this->cleanCache();

        return true;
    }

    /**
     * Updates balances of multiple accounts
     *
     * @param array $balanceChanges associative array of 'id' => 'balance' pairs
     * @param bool $updateInitial copy balance to initial balance, default is false
     *
     * @return bool
     */
    public function updateBalances(array $balanceChanges, bool $updateInitial = false)
    {
        if (!is_array($balanceChanges)) {
            return false;
        }
        if (count($balanceChanges) == 0) {
            return true;
        }

        $curDate = date("Y-m-d H:i:s");
        $accounts = [];
        foreach ($balanceChanges as $acc_id => $accountChanges) {
            $accObj = $this->getItem($acc_id);
            if (!$accObj) {
                return false;
            }

            if ($updateInitial) {
                $accObj->initbalance = $accountChanges["balance"];
            }

            if (isset($accountChanges["limit"])) {
                $accObj->limit = $accountChanges["limit"];
            }

            $accObj->balance = $accountChanges["balance"];
            $accObj->createdate = date("Y-m-d H:i:s", $accObj->createdate);
            $accObj->updatedate = $curDate;

            $accounts[] = (array)$accObj;
        }

        if (count($accounts) == 1 && !$updateInitial) {
            $account = $accounts[0];
            $this->setBalance($account["id"], $account["balance"], $account["limit"]);
        } else {
            if (!$this->dbObj->updateMultipleQ($this->tbl_name, $accounts)) {
                return false;
            }

            $this->cleanCache();
        }

        return true;
    }

    /**
     * Returns array of accounts
     *
     * @param array $params array of options:
     *     - 'visibility' => (string) - select accounts by visibility. Possible values: "all", "visible", "hidden"
     *     - 'owner' => (string|int) - select accounts by owner. Possible values: "all", "user" or (int) for id
     *     - 'type' => (int) - select accounts by type
     *     - 'sort' => (string) - sort result array. Possible value: "visibility"
     *
     * @return AccountItem[]
     */
    public function getData(array $params = [])
    {
        if (!$this->checkCache()) {
            return [];
        }

        $includePersons = (isset($params["owner"]) && $params["owner"] == "all");
        $requestedVisibility = isset($params["visibility"]) ? $params["visibility"] : "visible";
        $includeVisible = in_array($requestedVisibility, ["all", "visible"]);
        $includeHidden = in_array($requestedVisibility, ["all", "hidden"]);
        $sortByVisibility = (isset($params["sort"]) && $params["sort"] == "visibility");
        $typeFilter = (isset($params["type"]) && is_numeric($params["type"])) ? intval($params["type"]) : null;
        $person_id = (isset($params["owner"]) && is_numeric($params["owner"])) ? intval($params["owner"]) : 0;
        if ($person_id) {
            $includePersons = true;
        }

        $itemsData = [];
        if ($person_id && !$this->personMod->isExist($person_id) && UserModel::isAdminUser()) {
            $qResult = $this->dbObj->selectQ("*", $this->tbl_name, null, null, "id ASC");
            while ($row = $this->dbObj->fetchRow($qResult)) {
                $obj = $this->rowToObj($row);
                if (!is_null($obj)) {
                    $itemsData[$obj->id] = $obj;
                }
            }
        } else {
            $itemsData = $this->cache;
        }

        $res = [];
        foreach ($itemsData as $item) {
            if ($person_id && $item->owner_id != $person_id) {
                continue;
            }
            if (!$includePersons && $item->owner_id != self::$owner_id) {
                continue;
            }
            if (!is_null($typeFilter) && $item->type != $typeFilter) {
                continue;
            }
            $hidden = $this->isHidden($item);
            if ((!$includeHidden && $hidden) || (!$includeVisible && !$hidden)) {
                continue;
            }

            $res[] = $item;
        }

        if ($sortByVisibility) {
            usort($res, function ($a, $b) {
                return $a->flags - $b->flags;
            });
        }

        return $res;
    }

    /**
     * Returns true if specified item is hidden
     *
     * @param object|int|null $item id or item object
     *
     * @return bool
     */
    public function isHidden(mixed $item)
    {
        if (is_int($item)) {
            $item = $this->getItem($item);
        }
        if (!$item || !is_object($item) || !isset($item->flags)) {
            throw new \Error("Invalid account item");
        }

        return $item && ($item->flags & ACCOUNT_HIDDEN) == ACCOUNT_HIDDEN;
    }

    /**
     * Returns count of accounts
     *
     * @param array $params array of options:
     *     - 'visibility' => (string) - select accounts by visibility. Possible values: "all", "visible", "hidden"
     *     - 'type' => (int) - select accounts by type
     *     - 'full' => (bool) - include person accounts, default is false
     *
     * @return int
     */
    public function getCount(array $params = [])
    {
        $res = 0;

        if (!$this->checkCache()) {
            return $res;
        }

        $includePersons = (isset($params["full"]) && $params["full"] == true);
        $requestedVisibility = isset($params["visibility"]) ? $params["visibility"] : "visible";
        $includeVisible = in_array($requestedVisibility, ["all", "visible"]);
        $includeHidden = in_array($requestedVisibility, ["all", "hidden"]);
        $typeFilter = (isset($params["type"]) && is_numeric($params["type"])) ? intval($params["type"]) : 0;

        foreach ($this->cache as $item) {
            if (!$includePersons && $item->owner_id != self::$owner_id) {
                continue;
            }
            $hidden = $this->isHidden($item);
            if ((!$includeHidden && $hidden) || (!$includeVisible && !$hidden)) {
                continue;
            }
            if (!is_null($typeFilter) && $item->type != $typeFilter) {
                continue;
            }

            $res++;
        }

        return $res;
    }

    /**
     * Returns icon file name of specified account
     *
     * @param int $item_id account id
     *
     * @return string|null
     */
    public function getIconFile(int $item_id)
    {
        $item = $this->getItem($item_id);
        if (!$item) {
            return null;
        }

        $icon = $this->iconModel->getItem($item->icon_id);
        if (!$icon) {
            return null;
        }

        return $icon->file;
    }

    /**
     * Returns array of total sums per each currency
     *
     * @return array|null
     */
    public function getTotalsArray()
    {
        $res = [];

        if (!$this->checkCache()) {
            return $res;
        }

        foreach ($this->cache as $item) {
            if ($item->owner_id != self::$owner_id) {
                continue;
            }

            $currObj = $this->currMod->getItem($item->curr_id);
            if (!$currObj) {
                return null;
            }

            if (!isset($res[$item->curr_id])) {
                $res[$item->curr_id] = 0;
            }

            $res[$item->curr_id] += $item->balance;
        }

        return $res;
    }

    /**
     * Returns array of user accounts sorted by visibility
     *
     * @param array $params additional parameters
     *
     * @return AccountItem[]
     */
    public function getUserAccounts(array $params = [])
    {
        $params = array_merge($params, [
            "visibility" => "all",
            "sort" => "visibility",
        ]);

        return $this->getData($params);
    }

    /**
     * Try to find account of user different from specified
     *
     * @param int $acc_id account id, default is 0
     *
     * @return int
     */
    public function getAnother(int $acc_id = 0)
    {
        $acc_id = intval($acc_id);
        $items = $this->getUserAccounts();
        foreach ($items as $item) {
            if ($item->id != $acc_id) {
                return $item->id;
            }
        }

        return 0;
    }

    /**
     * Search for account with specified name
     *
     * @param string $name name of account to find
     * @param bool $caseSens case sensitive flag, default is false
     *
     * @return object|null
     */
    public function findByName(string $name, bool $caseSens = false)
    {
        if (is_empty($name)) {
            return null;
        }

        if (!$this->checkCache()) {
            return null;
        }

        if (!$caseSens) {
            $name = strtolower($name);
        }
        foreach ($this->cache as $item) {
            // Skip accounts of persons
            if ($item->owner_id != self::$owner_id) {
                continue;
            }

            if (
                ($caseSens && $item->name == $name) ||
                (!$caseSens && strtolower($item->name) == $name)
            ) {
                return $item;
            }
        }

        return null;
    }
}
