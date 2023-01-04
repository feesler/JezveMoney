<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;
use JezveMoney\App\Item\ImportRuleItem;

/**
 * Import rules model
 */
class ImportRuleModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    private static $user_id = 0;
    protected $tbl_name = "import_rule";
    protected $condModel = null;
    protected $actionModel = null;

    /**
     * Model initialization
     */
    protected function onStart()
    {
        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();

        $this->dbObj = MySqlDB::getInstance();
        $this->condModel = ImportConditionModel::getInstance();
        $this->actionModel = ImportActionModel::getInstance();
    }

    /**
     * Converts table row from database to object
     *
     * @param array $row - array of table row fields
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
        $avFields = ["flags"];
        $res = [];

        // In CREATE mode all fields is required
        if (!$item_id) {
            checkFields($params, $avFields, true);
        }

        if (isset($params["flags"])) {
            $res["flags"] = intval($params["flags"]);
        }

        return $res;
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
        $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
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
        foreach ($items as $item_id) {
            // check item is exist
            $itemObj = $this->getItem($item_id);
            if (!$itemObj) {
                return false;
            }
        }

        $res = $this->condModel->deleteRuleConditions($items)
            && $this->actionModel->deleteRuleActions($items);

        return $res;
    }

    /**
     * Returns array of items
     *
     * @param array $params
     *
     * @return array[ImportRuleItem]|null
     */
    public function getData(array $params = [])
    {
        $requestAll = (isset($params["full"]) && $params["full"] == true && UserModel::isAdminUser());
        $addExtended = isset($params["extended"]) && $params["extended"] == true;

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
                return null;
            }

            $itemsData = $this->cache;
        }

        $res = [];
        foreach ($itemsData as $item) {
            $itemObj = new ImportRuleItem($item, $requestAll);
            if ($addExtended) {
                $itemObj->conditions = $this->condModel->getRuleConditions($item->id);
                $itemObj->actions = $this->actionModel->getRuleActions($item->id);
            }
            $res[] = $itemObj;
        }

        return $res;
    }

    /**
     * Removes import rules without conditions or actions
     *
     * @return bool
     */
    protected function removeEmptyRules()
    {
        $items = $this->getData(["extended" => true]);
        $itemsToDelete = [];
        foreach ($items as $item) {
            if (
                !is_array($item->conditions)
                || !count($item->conditions)
                || !is_array($item->actions)
                || !count($item->actions)
            ) {
                $itemsToDelete[] = $item->id;
            }
        }

        return $this->del($itemsToDelete);
    }

    /**
     * Handles import template(s) delete event
     * Removes conditions related to removed templates
     *
     * @param mixed $templates
     *
     * @return bool
     */
    public function onTemplateDelete(mixed $templates)
    {
        if (is_null($templates)) {
            return false;
        }

        $res = $this->condModel->deleteTemplateConditions($templates)
            && $this->removeEmptyRules();

        return $res;
    }

    /**
     * Handles account(s) delete event
     * Removes conditions and actions related to removed accounts
     *
     * @param mixed $accounts
     *
     * @return bool
     */
    public function onAccountDelete(mixed $accounts)
    {
        if (is_null($accounts)) {
            return false;
        }

        $res = $this->condModel->deleteAccountConditions($accounts)
            && $this->actionModel->deleteAccountActions($accounts)
            && $this->removeEmptyRules();

        return $res;
    }

    // Delete conditions and actions related to removed accounts
    public function onPersonDelete($persons)
    {
        if (is_null($persons)) {
            return false;
        }

        $res = $this->actionModel->deletePersonActions($persons)
            && $this->removeEmptyRules();

        return $res;
    }

    // Delete conditions and actions related to removed categories
    public function onCategoryDelete($categories)
    {
        if (is_null($categories)) {
            return false;
        }

        $categories = asArray($categories);
        if (count($categories) === 0) {
            return true;
        }

        $res = $this->actionModel->deleteCategoryActions($categories)
            && $this->removeEmptyRules();

        return $res;
    }

    // Delete all import rules of user
    public function reset()
    {
        if (!self::$user_id) {
            return false;
        }

        $condArr = ["user_id=" . self::$user_id];
        if (!$this->dbObj->deleteQ($this->tbl_name, $condArr)) {
            return false;
        }

        $this->cleanCache();

        return true;
    }
}
