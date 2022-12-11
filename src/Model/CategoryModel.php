<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;
use JezveMoney\App\Item\CategoryItem;

class CategoryModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    private static $user_id = 0;

    protected $tbl_name = "categories";


    protected function onStart()
    {
        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();

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
        $res->user_id = intval($row["user_id"]);
        $res->parent_id = intval($row["parent_id"]);
        $res->name = $row["name"];
        $res->type = intval($row["type"]);
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
        $avFields = ["parent_id", "name", "type"];
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

        $res["parent_id"] = (isset($params["parent_id"])) ? intval($params["parent_id"]) : 0;
        if ($res["parent_id"] !== 0) {
            $parent = $this->getItem($res["parent_id"]);
            if (!$parent) {
                throw new \Error("Category not found");
            }
            if ($parent->parent_id !== 0) {
                throw new \Error("Invalid parent category");
            }
        }

        $res["type"] = (isset($params["type"])) ? intval($params["type"]) : 0;
        if ($res["type"] !== 0) {
            $typeName = TransactionModel::typeToString($res["type"]);
            if (is_null($typeName)) {
                throw new \Error("Invalid type specified");
            }
        }

        if ($this->isSameItemExist($res, $item_id)) {
            throw new \Error("Same category already exist");
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
        $res["user_id"] = self::$user_id;

        return $res;
    }


    // Preparations for item update
    protected function preUpdate($item_id, $params)
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


    // Preparations for item delete
    protected function preDelete($items)
    {
        $categoriesToDelete = [];

        foreach ($items as $item_id) {
            $category = $this->getItem($item_id);
            if (!$category) {
                return false;
            }
            // Add child categories to remove list
            $children = $this->getChildCategories($item_id);
            foreach ($children as $child) {
                $categoriesToDelete[] = $child->id;
            }
        }

        return $this->del($categoriesToDelete);
    }


    protected function postDelete($items)
    {
        $this->cleanCache();

        $transMod = TransactionModel::getInstance();
        $ruleModel = ImportRuleModel::getInstance();

        $res = $transMod->onCategoryDelete($items)
            && $ruleModel->onCategoryDelete($items);

        return $res;
    }

    /**
     * Delete all categories of user
     * @return [boolean]
     */
    public function reset()
    {
        if (!self::$user_id) {
            return false;
        }

        $itemsToDelete = $this->getData(["returnIds" => true]);

        $transMod = TransactionModel::getInstance();
        $ruleModel = ImportRuleModel::getInstance();

        $res = $transMod->onCategoryDelete($itemsToDelete)
            && $ruleModel->onCategoryDelete($itemsToDelete);
        if (!$res) {
            return false;
        }

        $condArr = ["user_id=" . self::$user_id];
        if (!$this->dbObj->deleteQ($this->tbl_name, $condArr)) {
            return false;
        }

        $this->cleanCache();

        return true;
    }

    /**
     * Returns array of categories
     *
     * @param array $params - array of parameters
     *    $params = [
     *      parent_id - filter categories by parent. Returns all if not set or set to zero
     *      returnIds - if true returns array of ids. Otherwise returns array of CategoryItem
     *    ]
     *
     * @return [int|CategoryItem]
     */
    public function getData($params = [])
    {
        $res = [];
        if (!$this->checkCache()) {
            return $res;
        }
        if (!is_array($params)) {
            $params = [];
        }

        $returnIds = isset($params["returnIds"]) ? $params["returnIds"] : false;
        $parentFilter = isset($params["parent_id"]) ? intval($params["parent_id"]) : 0;

        foreach ($this->cache as $item) {
            if ($parentFilter !== 0 && $item->parent_id !== $parentFilter) {
                continue;
            }

            $res[] = ($returnIds) ? $item->id : (new CategoryItem($item));
        }

        return $res;
    }


    public function getChildCategories($parentId = 0)
    {
        return $this->getData(["parent_id" => $parentId]);
    }


    public function findByName($name, $caseSens = false)
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
