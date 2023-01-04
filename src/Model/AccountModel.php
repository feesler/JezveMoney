<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;
use JezveMoney\App\Item\AccountItem;

use function JezveMoney\Core\inSetCondition;

define("ACCOUNT_HIDDEN", 1);

/**
 * Accounts model
 */
class AccountModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    private static $user_id = 0;
    private static $owner_id = 0;

    protected $tbl_name = "accounts";
    protected $currMod = null;
    protected $personMod = null;
    protected $iconModel = null;
    protected $currencyUpdated = false;
    protected $balanceUpdated = false;
    protected $removedItems = null;

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
     * @param array $row
     *
     * @return object|null
     */
    protected function rowToObj(array $row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new \stdClass();
        $res->id = intval($row["id"]);
        $res->user_id = intval($row["user_id"]);
        $res->name = $row["name"];
        $res->owner_id = intval($row["owner_id"]);
        $res->curr_id = intval($row["curr_id"]);
        $res->balance = floatval($row["balance"]);
        $res->initbalance = floatval($row["initbalance"]);
        $res->icon_id = intval($row["icon_id"]);
        $res->flags = intval($row["flags"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }

    /**
     * Returns data query object for CachedTable::updateCache()
     *
     * @return mysqli_result|bool
     */
    protected function dataQuery()
    {
        return $this->dbObj->selectQ("*", $this->tbl_name, "user_id=" . self::$user_id, null, "id ASC");
    }

    /**
     * Validates item fields before to send create/update request to database
     *
     * @param array $params - item fields
     * @param int $item_id - item id
     *
     * @return array
     */
    protected function validateParams(array $params, int $item_id = 0)
    {
        $avFields = ["owner_id", "name", "initbalance", "curr_id", "icon_id", "flags"];
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

        if (isset($params["name"])) {
            $res["name"] = $this->dbObj->escape($params["name"]);
            if (is_empty($res["name"])) {
                throw new \Error("Invalid name specified");
            }
        }

        if (isset($params["initbalance"])) {
            $res["initbalance"] = floatval($params["initbalance"]);
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
     * @param array $params - item fields
     * @param int $item_id - item id
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
     * @param array $params - item fields
     * @param bool $isMultiple - flag for multiple create
     *
     * @return array|null
     */
    protected function preCreate(array $params, bool $isMultiple = false)
    {
        $res = $this->validateParams($params);

        $res["balance"] = $res["initbalance"];
        $res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");
        $res["user_id"] = self::$user_id;

        return $res;
    }

    /**
     * Checks update conditions and returns array of expressions
     *
     * @param int $item_id - item id
     * @param array $params - item fields
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

        // get initial balance to calc difference
        $diff = normalize($res["initbalance"] - $item->initbalance);
        if (abs($diff) >= 0.01) {
            $this->balanceUpdated = true;
            $res["balance"] = $item->balance + $diff;
        } else {
            $this->balanceUpdated = false;
            unset($res["balance"]);
            unset($res["initbalance"]);
        }

        $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }


    protected function postUpdate(int $item_id)
    {
        $this->cleanCache();

        if ($this->currencyUpdated || $this->balanceUpdated) {
            $transMod = TransactionModel::getInstance();

            $transMod->onAccountUpdate($item_id);
        }

        $this->currencyUpdated = false;
        $this->balanceUpdated = false;
    }

    /**
     * Checks delete conditions and returns bool result
     *
     * @param array $items - array of item ids to remove
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


    protected function postDelete(mixed $items)
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


    public function show(mixed $items, bool $val = true)
    {
        if (!is_array($items)) {
            $items = [$items];
        }

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


    public function hide(mixed $items)
    {
        return $this->show($items, false);
    }


    // Return account of person with specified currency if exist
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
            return false;
        }

        foreach ($this->cache as $item) {
            if ($item->owner_id == $person_id && $item->curr_id == $curr_id) {
                return $item;
            }
        }

        return null;
    }


    // Create account with specified currency for person
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
            "owner_id" => $person_id,
            "name" => "acc_" . $person_id . "_" . $curr_id,
            "initbalance" => 0.0,
            "curr_id" => $curr_id,
            "icon_id" => 0,
            "flags" => 0
        ]);

        return $this->getItem($createRes);
    }


    // Remove accounts of specified person(s)
    public function onPersonDelete(mixed $persons)
    {
        if (is_null($persons)) {
            return;
        }
        if (!is_array($persons)) {
            $persons = [$persons];
        }

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


    // Set new value of account
    private function setValue(int $acc_id, string $field, string $newValue)
    {
        if (!$acc_id || is_null($field) || $field == "") {
            return false;
        }

        $newValue = $this->dbObj->escape($newValue);

        if (
            !$this->update(
                $acc_id,
                [
                    $field => $newValue,
                    "updatedate" => date("Y-m-d H:i:s")
                ]
            )
        ) {
            return false;
        }

        $this->cleanCache();

        return true;
    }


    // Delete all accounts of user
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
        if (!is_array($users)) {
            $users = [$users];
        }

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


    // Set balance of account
    public function setBalance(int $acc_id, float $balance)
    {
        $accObj = $this->getItem($acc_id);
        if (!$accObj) {
            return null;
        }

        if (!$this->dbObj->updateQ($this->tbl_name, ["balance" => $balance], "id=" . $acc_id)) {
            return false;
        }

        $this->cleanCache();

        return true;
    }


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
        foreach ($balanceChanges as $acc_id => $balance) {
            $accObj = $this->getItem($acc_id);
            if (!$accObj) {
                return null;
            }

            if ($updateInitial) {
                $accObj->initbalance = $balance;
            }

            $accObj->balance = $balance;
            $accObj->createdate = date("Y-m-d H:i:s", $accObj->createdate);
            $accObj->updatedate = $curDate;

            $accounts[] = (array)$accObj;
        }

        if (count($accounts) == 1 && !$updateInitial) {
            $account = $accounts[0];
            $this->setBalance($account["id"], $account["balance"]);
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
     * @param array $params - array of parameters
     *    $params = [
     *      visibility - select accounts by visibility. Possible values: "all", "visible", "hidden"
     *      owner - select accounts by owner. Possible values: "all", "user" or (int) for id
     *      sort - sort result array. Possible value: "visibility"
     *    ]
     *
     * @return array[AccountItem]
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
            $hidden = $this->isHidden($item);
            if ((!$includeHidden && $hidden) || (!$includeVisible && !$hidden)) {
                continue;
            }

            $accObj = new AccountItem($item);

            $res[] = $accObj;
        }

        if ($sortByVisibility) {
            usort($res, function ($a, $b) {
                return $a->flags - $b->flags;
            });
        }

        return $res;
    }


    // Check item is hidden
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


    // Return count of objects
    public function getCount(array $params = [])
    {
        $res = 0;

        if (!$this->checkCache()) {
            return $res;
        }

        $includePersons = (isset($params["full"]) && $params["full"] == true);
        $requestedType = isset($params["type"]) ? $params["type"] : "visible";
        $includeVisible = in_array($requestedType, ["all", "visible"]);
        $includeHidden = in_array($requestedType, ["all", "hidden"]);

        foreach ($this->cache as $item) {
            if (!$includePersons && $item->owner_id != self::$owner_id) {
                continue;
            }
            $hidden = $this->isHidden($item);
            if ((!$includeHidden && $hidden) || (!$includeVisible && !$hidden)) {
                continue;
            }

            $res++;
        }

        return $res;
    }


    // Return icon file name of specified account
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


    // Return array of total sums per each currency
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


    // Returns array of user accounts sorted by visibility
    public function getUserAccounts()
    {
        return $this->getData(["visibility" => "all", "sort" => "visibility"]);
    }


    // Try to find account of user different from specified
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
     * Searches for account with specified name
     *
     * @param string $name - name of account to find
     * @param bool $caseSens - case sensitive flag
     *
     * @return object|null
     */
    public function findByName(string $acc_name, bool $caseSens = false)
    {
        if (is_empty($acc_name)) {
            return null;
        }

        if (!$this->checkCache()) {
            return null;
        }

        if (!$caseSens) {
            $acc_name = strtolower($acc_name);
        }
        foreach ($this->cache as $item) {
            // Skip accounts of persons
            if ($item->owner_id != self::$owner_id) {
                continue;
            }

            if (
                ($caseSens && $item->name == $acc_name) ||
                (!$caseSens && strtolower($item->name) == $acc_name)
            ) {
                return $item;
            }
        }

        return null;
    }
}
