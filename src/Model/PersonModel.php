<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\CachedInstance;
use JezveMoney\Core\Singleton;
use JezveMoney\App\Item\PersonItem;

use function JezveMoney\Core\inSetCondition;

define("PERSON_HIDDEN", 1);

/**
 * Person model
 */
class PersonModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    private static $user_id = 0;
    private static $owner_id = 0;
    protected $adminForce = false;
    protected $tbl_name = "persons";

    /**
     * Model initialization
     */
    protected function onStart()
    {
        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();
        self::$owner_id = $uMod->getOwner();

        $this->dbObj = MySqlDB::getInstance();
    }

    /**
     * Converts table row from database to object
     *
     * @param array $row array of table row fields
     *
     * @return PersonItem|null
     */
    protected function rowToObj(array $row)
    {
        return PersonItem::fromTableRow($row);
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
        $res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }

    /**
     * Updates specified person of different user. Admin access is required
     *
     * @param int $item_id item id
     * @param array $params item fields
     *
     * @return bool
     */
    public function adminUpdate(int $item_id, array $params)
    {
        if (!UserModel::isAdminUser()) {
            return false;
        }

        $this->adminForce = true;
        $res = $this->update($item_id, $params);
        $this->adminForce = false;

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
        if (!$this->adminForce && $item->user_id != self::$user_id) {
            throw new \Error("Invalid user");
        }

        $res = $this->validateParams($params, $item_id);
        $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }

    /**
     * Removes specified persons of different user. Admin access is required
     *
     * @param int|int[]|null $items id or array of person ids to remove
     *
     * @return bool
     */
    public function adminDelete(mixed $items)
    {
        if (!UserModel::isAdminUser()) {
            return false;
        }

        $this->adminForce = true;
        $res = $this->del($items);
        $this->adminForce = false;

        return $res;
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

    /**
     * Shows or hides specified persons
     *
     * @param int|int[]|null $items id or array of person ids to show/hide
     * @param bool $val show if true, hide otherwise
     *
     * @return bool
     */
    public function show(mixed $items, bool $val = true)
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

    /**
     * Hides specified persons
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
     * Returns id of item at specified position
     *
     * @param int $pos item position
     *
     * @return int
     */
    public function getIdByPos(int $pos)
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

    /**
     * Search for person with specified name
     *
     * @param string $name name of person to find
     * @param bool $caseSens case sensitive flag
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
        foreach ($this->cache as $p_id => $item) {
            // Skip person of user
            if ($p_id == self::$owner_id) {
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

    /**
     * Removes all persons of user except owner of user
     *
     * @return bool
     */
    public function reset()
    {
        if (!self::$user_id || !self::$owner_id) {
            return false;
        }

        // delete import rules
        $userPersons = $this->getData(["full" => true, "visibility" => "all"]);
        $personsToDelete = [];
        foreach ($userPersons as $person) {
            $personsToDelete[] = $person->id;
        }

        $ruleModel = ImportRuleModel::getInstance();
        $ruleModel->onPersonDelete($personsToDelete);

        $accMod = AccountModel::getInstance();
        $accMod->onPersonDelete($personsToDelete);

        $condArr = ["user_id=" . self::$user_id, "id<>" . self::$owner_id];
        if (!$this->dbObj->deleteQ($this->tbl_name, $condArr)) {
            return false;
        }

        $this->cleanCache();

        return true;
    }

    /**
     * Return specified item from cache
     *
     * @param int $obj_id item id
     *
     * @return object|null
     */
    public function getItem(int $obj_id)
    {
        $item = parent::getItem($obj_id);
        if (is_null($item) && intval($obj_id) && UserModel::isAdminUser()) {
            $qResult = $this->dbObj->selectQ("*", $this->tbl_name, "id=" . intval($obj_id));
            $row = $this->dbObj->fetchRow($qResult);
            $item = $this->rowToObj($row);
        }

        return $item;
    }

    /**
     * Returns count of persons
     *
     * @param array $params array of options:
     *     - 'user' => (int) - select persons by user. Admin access is required
     *
     * @return int
     */
    public function getCount(array $params = [])
    {
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
     * Returns array of persons
     *
     * @param array $params array of options:
     *     - 'full' => (bool): return persons of all users. Admin access is required
     *     - 'visibility' => (string): select persons by visibility. Possible values: "all", "visible", "hidden"
     *     - 'sort' => (string): sort result array. Possible value: "visibility"
     *
     * @return PersonItem[]
     */
    public function getData(array $params = [])
    {
        $accMod = AccountModel::getInstance();
        $requestAll = (isset($params["full"]) && $params["full"] == true && UserModel::isAdminUser());
        $requestedVisibility = isset($params["visibility"]) ? $params["visibility"] : "visible";
        $includeVisible = in_array($requestedVisibility, ["all", "visible"]);
        $includeHidden = in_array($requestedVisibility, ["all", "hidden"]);
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

            $itemObj = clone $item;
            $itemObj->setAccounts($accMod->getData(["owner" => $item->id]));

            $res[] = $itemObj;
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
            throw new \Error("Invalid person item");
        }

        return $item && ($item->flags & PERSON_HIDDEN) == PERSON_HIDDEN;
    }
}
