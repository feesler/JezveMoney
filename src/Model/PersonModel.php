<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\CachedInstance;
use JezveMoney\Core\Singleton;
use JezveMoney\App\Item\PersonItem;

use function JezveMoney\Core\inSetCondition;

define("PERSON_HIDDEN", 1);

class PersonModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    private static $user_id = 0;
    private static $owner_id = 0;        // person of user
    protected $adminForce = false;
    protected $tbl_name = "persons";


    protected function onStart()
    {
        // find owner person
        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();
        self::$owner_id = $uMod->getOwner();

        $this->dbObj = MySqlDB::getInstance();
    }


    // Convert DB row to item object
    protected function rowToObj($row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new \stdClass();
        $res->id = intval($row["id"]);
        $res->name = $row["name"];
        $res->user_id = intval($row["user_id"]);
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


    protected function validateParams($params, $item_id = 0)
    {
        $avFields = ["name", "flags"];
        $res = [];

        // In CREATE mode all fields is required
        if (!$item_id) {
            checkFields($params, $avFields, true);
        }

        if (isset($params["name"])) {
            $res["name"] = $this->dbObj->escape($params["name"]);
            if (is_empty($res["name"])) {
                throw new \Error("Invalid name specified");
            }
        }

        // Registration/admin case
        if (isset($params["user_id"])) {
            $res["user_id"] = intval($params["user_id"]);
            if (
                !$res["user_id"] ||
                (self::$user_id && $res["user_id"] != self::$user_id && !UserModel::isAdminUser())
            ) {
                throw new \Error("Invalid user_id");
            }
        } elseif (self::$user_id) {
            $res["user_id"] = self::$user_id;
        } else {
            throw new \Error("Can't obtain user_id");
        }

        if (isset($params["flags"])) {
            $res["flags"] = intval($params["flags"]);
        }

        if ($this->isSameItemExist($res, $item_id)) {
            throw new \Error("Same person already exist");
        }

        return $res;
    }


    // Check same item already exist
    protected function isSameItemExist($params, $item_id = 0)
    {
        if (!is_array($params) || !isset($params["name"])) {
            return false;
        }

        $foundItem = $this->findByName($params["name"]);
        return ($foundItem && $foundItem->id != $item_id);
    }


    // Preparations for item create
    protected function preCreate($params, $isMultiple = false)
    {
        $res = $this->validateParams($params);
        $res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }


    public function adminUpdate($item_id, $params)
    {
        if (!UserModel::isAdminUser()) {
            return false;
        }

        $this->adminForce = true;
        $res = $this->update($item_id, $params);
        $this->adminForce = false;

        return $res;
    }


    // Preparations for item update
    protected function preUpdate($item_id, $params)
    {
        $item = $this->getItem($item_id);
        if (!$item) {
            throw new \Error("Item not found");
        }
        if (!$this->adminForce && $item->user_id != self::$user_id) {
            throw new \Error("Invalid user");
        }

        $res = $this->validateParams($params, $item_id);
        $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }


    public function adminDelete($items)
    {
        if (!UserModel::isAdminUser()) {
            return false;
        }

        $this->adminForce = true;
        $res = $this->del($items);
        $this->adminForce = false;

        return $res;
    }


    // Preparations for items delete
    protected function preDelete($items)
    {
        foreach ($items as $item_id) {
            // check person is exist
            $pObj = $this->getItem($item_id);
            if (!$pObj) {
                return false;
            }

            // check user of person
            if (!$this->adminForce && $pObj->user_id != self::$user_id) {
                return false;
            }
        }

        $accMod = AccountModel::getInstance();
        $ruleModel = ImportRuleModel::getInstance();

        $res = $accMod->onPersonDelete($items)
            && $ruleModel->onPersonDelete($items);

        return $res;
    }


    public function show($items, $val = true)
    {
        if (!is_array($items)) {
            $items = [$items];
        }

        foreach ($items as $item_id) {
            // check person is exist
            $accObj = $this->getItem($item_id);
            if (!$accObj) {
                return false;
            }

            // check user of person
            if ($accObj->user_id != self::$user_id) {
                return false;
            }
        }

        if ($val) {
            $condition = ["flags=flags&~" . PERSON_HIDDEN];
        } else {
            $condition = ["flags=flags|" . PERSON_HIDDEN];
        }

        $updRes = $this->dbObj->updateQ(
            $this->tbl_name,
            $condition,
            "id" . inSetCondition($items)
        );
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


    // Return person id by specified position
    public function getIdByPos($pos)
    {
        if (!$this->checkCache()) {
            return 0;
        }

        // Check user not logged in or there is only user owner person
        if (!self::$owner_id || count(self::$dcache) == 1) {
            return 0;
        }

        $keys = array_keys(self::$dcache);
        if (isset($keys[$pos])) {
            if ($keys[$pos] == self::$owner_id) {
                return ($pos < count($keys) - 1) ? $keys[$pos + 1] : $keys[$pos - 1];
            } else {
                return $keys[$pos];
            }
        }

        return 0;
    }


    // Search person with specified name and return id if success
    public function findByName($p_name, $caseSens = false)
    {
        if (is_empty($p_name)) {
            return null;
        }

        if (!$this->checkCache()) {
            return 0;
        }

        if (!$caseSens) {
            $p_name = strtolower($p_name);
        }
        foreach ($this->cache as $p_id => $item) {
            // Skip person of user
            if ($p_id == self::$owner_id) {
                continue;
            }

            if (
                ($caseSens && $item->name == $p_name) ||
                (!$caseSens && strtolower($item->name) == $p_name)
            ) {
                return $item;
            }
        }

        return 0;
    }


    // Delete all persons except owner of user
    public function reset()
    {
        if (!self::$user_id || !self::$owner_id) {
            return false;
        }

        // delete import rules
        $userPersons = $this->getData(["full" => true, "type" => "all"]);
        $personsToDelete = [];
        foreach ($userPersons as $person) {
            $personsToDelete[] = $person->id;
        }

        $ruleModel = ImportRuleModel::getInstance();
        $ruleModel->onPersonDelete($personsToDelete);

        $condArr = ["user_id=" . self::$user_id, "id<>" . self::$owner_id];
        if (!$this->dbObj->deleteQ($this->tbl_name, $condArr)) {
            return false;
        }

        $this->cleanCache();

        return true;
    }


    public function getItem($obj_id)
    {
        $item = parent::getItem($obj_id);
        if (is_null($item) && intval($obj_id) && UserModel::isAdminUser()) {
            $qResult = $this->dbObj->selectQ("*", $this->tbl_name, "id=" . intval($obj_id));
            $row = $this->dbObj->fetchRow($qResult);
            $item = $this->rowToObj($row);
        }

        return $item;
    }


    // Return count of objects
    public function getCount($params = null)
    {
        if (!is_array($params)) {
            $params = [];
        }

        $userRequest = isset($params["user"]) ? intval($params["user"]) : 0;

        if ($userRequest && UserModel::isAdminUser()) {
            $uMod = UserModel::getInstance();
            $uObj = $uMod->getItem($userRequest);
            if (!$uObj) {
                return 0;
            }

            return $this->dbObj->countQ(
                $this->tbl_name,
                [
                    "user_id=" . $userRequest,
                    "id<>" . $uObj->owner_id
                ]
            );
        } else {
            return parent::getCount();
        }
    }


    /**
     * Return array of persons
     *
     * @param array{string} $params
     *      Query parameters
     *      - full (boolean): if set to true and current user have admin rights method
     *                        will return persons of all users ;
     *      - type (string): visibility filter. Possible values: "all", "visible", "hidden" ;
     *
     * @return array of person objects
     */
    public function getData($params = null)
    {
        if (!is_array($params)) {
            $params = [];
        }

        $accMod = AccountModel::getInstance();
        $requestAll = (isset($params["full"]) && $params["full"] == true && UserModel::isAdminUser());
        $requestedType = isset($params["type"]) ? $params["type"] : "visible";
        $includeVisible = in_array($requestedType, ["all", "visible"]);
        $includeHidden = in_array($requestedType, ["all", "hidden"]);
        $sortByVisibility = (isset($params["sort"]) && $params["sort"] == "visibility");

        $itemsData = [];
        if ($requestAll) {
            $qResult = $this->dbObj->selectQ("*", $this->tbl_name, null, null, "id ASC");
            while ($row = $this->dbObj->fetchRow($qResult)) {
                $itemObj = $this->rowToObj($row);
                if ($itemObj) {
                    $itemsData[] = $itemObj;
                }
            }
        } else {
            if (!$this->checkCache()) {
                return [];
            }

            $itemsData = $this->cache;
        }

        $res = [];
        foreach ($itemsData as $item) {
            if (!$requestAll && $item->id == self::$owner_id) {
                continue;
            }
            $hidden = $this->isHidden($item);
            if ((!$includeHidden && $hidden) || (!$includeVisible && !$hidden)) {
                continue;
            }

            $itemObj = new PersonItem($item);
            $itemObj->accounts = $accMod->getData(["person" => $item->id]);

            $res[] = $itemObj;
        }

        if ($sortByVisibility) {
            usort($res, function ($a, $b) {
                return $a->flags - $b->flags;
            });
        }

        return $res;
    }


    // Check item is hidden
    public function isHidden($item)
    {
        if (is_int($item)) {
            $item = $this->getItem($item);
        }
        if (!$item || !is_object($item) || !isset($item->flags)) {
            throw new \Error("Invalid person item");
        }

        return $item && ($item->flags & PERSON_HIDDEN) == PERSON_HIDDEN;
    }
}
