<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;
use JezveMoney\App\Item\CategoryItem;

define("NO_CATEGORY", 0);

/**
 * Transaction category model
 */
class CategoryModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    private static $user_id = 0;

    protected $tbl_name = "categories";

    /**
     * Model initialization
     */
    protected function onStart()
    {
        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();

        $this->dbObj = MySqlDB::getInstance();
    }

    /**
     * Converts table row from database to object
     *
     * @param array $row array of table row fields
     *
     * @return CategoryItem|null
     */
    protected function rowToObj(array $row)
    {
        return CategoryItem::fromTableRow($row);
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

        $parent = null;
        $res["parent_id"] = (isset($params["parent_id"])) ? intval($params["parent_id"]) : 0;
        if ($res["parent_id"] !== 0) {
            $parent = $this->getItem($res["parent_id"]);
            if (!$parent) {
                throw new \Error("Category not found");
            }
            if ($parent->parent_id !== 0) {
                throw new \Error("Invalid parent category");
            }
            if ($item_id !== 0 && $res["parent_id"] === $item_id) {
                throw new \Error("Category can't be parent to itself");
            }
        }

        $res["type"] = (isset($params["type"])) ? intval($params["type"]) : 0;
        if ($res["type"] !== 0) {
            $typeName = TransactionModel::typeToString($res["type"]);
            if (is_null($typeName)) {
                throw new \Error("Invalid type specified");
            }
        }
        if (!is_null($parent) && $parent->type !== $res["type"]) {
            throw new \Error("Transaction type of child category must be the same as parent");
        }

        if ($this->isSameItemExist($res, $item_id)) {
            throw new \Error("Same category already exist");
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
        $res["user_id"] = self::$user_id;

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

        $item = $this->getItem($item_id);
        if (!$item) {
            throw new \Error("Item not found");
        }

        // Update transaction type of children categories
        $updRes = $this->dbObj->updateQ(
            $this->tbl_name,
            ["type" => $item->type],
            [
                "user_id=" . self::$user_id,
                "parent_id=" . $item_id,
            ],
        );
        if (!$updRes) {
            return false;
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
        $categoriesToDelete = [];

        foreach ($items as $item_id) {
            $category = $this->getItem($item_id);
            if (!$category) {
                return false;
            }
            // Add child categories to remove list
            $children = $this->findByParent($item_id);
            foreach ($children as $child) {
                $categoriesToDelete[] = $child->id;
            }
        }

        return $this->del($categoriesToDelete);
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

        $res = $transMod->onCategoryDelete($items)
            && $ruleModel->onCategoryDelete($items);

        return $res;
    }

    /**
     * Removes all categories of user
     *
     * @return bool
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
     * @param array $params options array:
     *     - 'parent_id' => (int) - filter categories by parent. Returns all if not set
     *     - 'returnIds' => (bool) - if true returns array of ids. Otherwise returns array of CategoryItem
     *
     * @return int[]|CategoryItem[]
     */
    public function getData(array $params = [])
    {
        $res = [];
        if (!$this->checkCache()) {
            return $res;
        }

        $returnIds = isset($params["returnIds"]) ? $params["returnIds"] : false;
        $parentFilter = isset($params["parent_id"]) ? intval($params["parent_id"]) : null;

        foreach ($this->cache as $item) {
            if (!is_null($parentFilter) && $item->parent_id !== $parentFilter) {
                continue;
            }

            $res[] = ($returnIds) ? $item->id : $item;
        }

        return $res;
    }

    /**
     * Returns array of child categories for specified parent
     *
     * @param int $parentId parent category id, default is 0
     *
     * @return array
     */
    public function findByParent(int $parentId = 0)
    {
        return $this->getData(["parent_id" => $parentId]);
    }

    /**
     * Search for category with specified name
     *
     * @param string $name name of category to find
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
