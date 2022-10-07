<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;
use JezveMoney\App\Item\AccountItem;

use function JezveMoney\Core\inSetCondition;

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


    // Convert DB row to item object
    protected function rowToObj($row)
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


    // Called from CachedTable::updateCache() and return data query object
    protected function dataQuery()
    {
        return $this->dbObj->selectQ("*", $this->tbl_name, "user_id=" . self::$user_id, null, "id ASC");
    }


    protected function validateParams($params, $isUpdate = false)
    {
        $avFields = ["owner_id", "name", "initbalance", "curr_id", "icon_id", "flags"];
        $res = [];

        // In CREATE mode all fields is required
        if (!$isUpdate && !checkFields($params, $avFields)) {
            return null;
        }

        if (isset($params["owner_id"])) {
            $res["owner_id"] = intval($params["owner_id"]);
            if (!$res["owner_id"]) {
                wlog("Invalid owner_id specified");
                return null;
            }
        }

        if (isset($params["name"])) {
            $res["name"] = $this->dbObj->escape($params["name"]);
            if (is_empty($res["name"])) {
                wlog("Invalid name specified");
                return null;
            }
        }

        if (isset($params["initbalance"])) {
            $res["initbalance"] = floatval($params["initbalance"]);
        }

        if (isset($params["curr_id"])) {
            $res["curr_id"] = intval($params["curr_id"]);
            if (!$this->currMod->isExist($res["curr_id"])) {
                wlog("Invalid curr_id specified");
                return null;
            }
        }

        if (isset($params["icon_id"])) {
            $res["icon_id"] = intval($params["icon_id"]);
            if ($res["icon_id"] != 0 && !$this->iconModel->isExist($res["icon_id"])) {
                wlog("Invalid icon_id specified");
                return null;
            }
        }

        if (isset($params["flags"])) {
            $res["flags"] = intval($params["flags"]);
        }

        return $res;
    }


    // Check same item already exist
    protected function isSameItemExist($params, $updateId = 0)
    {
        if (!is_array($params) || !isset($params["name"])) {
            return false;
        }

        $foundItem = $this->findByName($params["name"]);
        if ($foundItem && $foundItem->id != $updateId) {
            wlog("Such item already exist");
            return true;
        }

        return false;
    }


    // Preparations for item create
    protected function preCreate($params, $isMultiple = false)
    {
        $res = $this->validateParams($params);
        if (is_null($res)) {
            return null;
        }

        if ($this->isSameItemExist($res)) {
            throw new \Error("Same account already exist");
        }

        $res["balance"] = $res["initbalance"];
        $res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");
        $res["user_id"] = self::$user_id;

        return $res;
    }


    // Preparations for item update
    protected function preUpdate($item_id, $params)
    {
        // check account is exist
        $accObj = $this->getItem($item_id);
        if (!$accObj) {
            return false;
        }

        // check user of account
        if ($accObj->user_id != self::$user_id) {
            return false;
        }

        $res = $this->validateParams($params, true);
        if (is_null($res)) {
            return false;
        }

        if ($this->isSameItemExist($res, $item_id)) {
            throw new \Error("Same account already exist");
        }

        $this->currencyUpdated = (isset($res["curr_id"]) && $res["curr_id"] != $accObj->curr_id);

        // get initial balance to calc difference
        $diff = round($res["initbalance"] - $accObj->initbalance, 2);
        if (abs($diff) >= 0.01) {
            $this->balanceUpdated = true;
            $res["balance"] = $accObj->balance + $diff;
        } else {
            $this->balanceUpdated = false;
            unset($res["balance"]);
            unset($res["initbalance"]);
        }

        $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }


    protected function postUpdate($item_id)
    {
        $this->cleanCache();

        if ($this->currencyUpdated || $this->balanceUpdated) {
            $transMod = TransactionModel::getInstance();

            $transMod->onAccountUpdate($item_id);
        }

        $this->currencyUpdated = false;
        $this->balanceUpdated = false;
    }


    // Preparations for item delete
    protected function preDelete($items)
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


    protected function postDelete($items)
    {
        $this->cleanCache();

        $transMod = TransactionModel::getInstance();
        $ruleModel = ImportRuleModel::getInstance();

        $res = $transMod->onAccountDelete($this->removedItems)
            && $ruleModel->onAccountDelete($items);
        $this->removedItems = null;

        return $res;
    }


    public function show($items, $val = true)
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


    public function hide($items)
    {
        return $this->show($items, false);
    }


    // Return account of person with specified currency if exist
    public function getPersonAccount($person_id, $curr_id)
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
    public function createPersonAccount($person_id, $curr_id)
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
    public function onPersonDelete($persons)
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
    private function setValue($acc_id, $field, $newValue)
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
    public function reset($params = null)
    {
        if (!$this->checkCache()) {
            return false;
        }

        if (!is_array($params)) {
            $params = [];
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
        $userAccounts = $this->getData(["full" => $deletePersons, "type" => "all"]);
        $accountsToDelete = [];
        foreach ($userAccounts as $account) {
            $accountsToDelete[] = $account->id;
        }

        $ruleModel = ImportRuleModel::getInstance();
        $ruleModel->onAccountDelete($accountsToDelete);

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
    public function setBalance($acc_id, $balance)
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


    public function updateBalances($balanceChanges, $updateInitial = false)
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


    // Return name of account if owner is user or name of person else
    public function getNameOrPerson($acc_id)
    {
        $accObj = $this->getItem($acc_id);
        if (!$accObj || !isset($accObj->owner_id)) {
            return null;
        }

        if (self::$owner_id == $accObj->owner_id) {
            return $accObj->name;
        } else {
            $pObj = $this->personMod->getItem($accObj->owner_id);
            if (!$pObj) {
                return null;
            }

            return $pObj->name;
        }
    }


    // Return array of accounts
    // $params - array of parameters
    //   full - if set to true include accounts of persons
    //   type - select user accounts by visibility. Possible values: "all", "visible", "hidden"
    //   person - return accounts of specified person
    public function getData($params = null)
    {
        $resArr = [];

        if (!$this->checkCache()) {
            return $resArr;
        }

        if (!is_array($params)) {
            $params = [];
        }

        $includePersons = (isset($params["full"]) && $params["full"] == true);
        $requestedType = isset($params["type"]) ? $params["type"] : "visible";
        $includeVisible = in_array($requestedType, ["all", "visible"]);
        $includeHidden = in_array($requestedType, ["all", "hidden"]);
        $person_id = (isset($params["person"])) ? intval($params["person"]) : 0;
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

            $resArr[] = $accObj;
        }

        return $resArr;
    }


    // Check item is hidden
    public function isHidden($item)
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
    public function getCount($params = null)
    {
        $res = 0;

        if (!$this->checkCache()) {
            return $res;
        }

        if (!is_array($params)) {
            $params = [];
        }

        $includePersons = (isset($params["full"]) && $params["full"] == true);
        $requestedType = isset($params["type"]) ? $params["type"] : "visible";
        $includeVisible = in_array($requestedType, ["all", "visible"]);
        $includeHidden = in_array($requestedType, ["all", "hidden"]);

        foreach ($this->cache as $acc_id => $item) {
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
    public function getIconFile($item_id)
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


    // Try to find visible account different from specified
    public function getAnother($acc_id)
    {
        $acc_id = intval($acc_id);
        if ($acc_id != 0 && $this->getCount(["type" => "visible"]) < 2) {
            return 0;
        }

        foreach ($this->cache as $item) {
            if (
                $item->id != $acc_id &&
                $item->owner_id == self::$owner_id &&
                !$this->isHidden($item)
            ) {
                return $item->id;
            }
        }

        return 0;
    }


    public function findByName($acc_name, $caseSens = false)
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
