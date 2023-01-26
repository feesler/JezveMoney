<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\App\Item\CategoryItem;

use function JezveMoney\Core\inSetCondition;

define("NO_CATEGORY", 0);

/**
 * Transaction category model
 */
class CategoryModel extends CachedTable
{
    use Singleton;

    private static $user_id = 0;

    protected $tbl_name = "categories";
    public $removeChild = true;
    protected $latestPos = null;

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
     * @param array|null $row array of table row fields
     *
     * @return CategoryItem|null
     */
    protected function rowToObj(?array $row)
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

        if (is_null($this->latestPos)) {
            $this->latestPos = $this->getLatestPos();
        }
        $this->latestPos++;

        $res["pos"] = $this->latestPos;
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

        // Set same transaction type for children categories
        $assignments = ["type" => $item->type];
        // In case current item is subcategory then set same parent category for
        // children categories to avoid third level of nesting
        if ($item->parent_id !== 0) {
            $assignments["parent_id"] = $item->parent_id;
        }

        $updRes = $this->dbObj->updateQ(
            $this->tbl_name,
            $assignments,
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
        $childCategories = [];
        foreach ($items as $item_id) {
            $category = $this->getItem($item_id);
            if (!$category) {
                return false;
            }
            // Add child categories to remove list
            $children = $this->findByParent($item_id);
            foreach ($children as $child) {
                $childCategories[] = $child->id;
            }
        }

        if (count($childCategories) === 0) {
            return true;
        }

        if ($this->removeChild) {
            return $this->del($childCategories);
        }

        $updRes = $this->dbObj->updateQ(
            $this->tbl_name,
            ["parent_id" => 0],
            [
                "user_id=" . self::$user_id,
                "id" . inSetCondition($childCategories),
            ],
        );

        return $updRes;
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
     * Updates position of item and fix position of items between old and new position
     *
     * @param int $item_id
     * @param int $new_pos
     *
     * @return bool
     */
    protected function updatePos(int $item_id, int $new_pos)
    {
        $item_id = intval($item_id);
        $new_pos = intval($new_pos);
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
            if ($old_pos == 0) {           // insert with specified position
                $res = $this->dbObj->updateQ(
                    $this->tbl_name,
                    ["pos=pos+1"],
                    ["user_id=" . self::$user_id, "pos >= $new_pos"],
                );
            } elseif ($new_pos < $old_pos) {       // moving up
                $res = $this->dbObj->updateQ(
                    $this->tbl_name,
                    ["pos=pos+1"],
                    ["user_id=" . self::$user_id, "pos >= $new_pos", "pos < $old_pos"],
                );
            } elseif ($new_pos > $old_pos) {        // moving down
                $res = $this->dbObj->updateQ(
                    $this->tbl_name,
                    ["pos=pos-1"],
                    ["user_id=" . self::$user_id, "pos > $old_pos", "pos <= $new_pos"],
                );
            }
            if (!$res) {
                return false;
            }
        }

        if (!$this->dbObj->updateQ($this->tbl_name, ["pos" => $new_pos], "id=" . $item_id)) {
            return false;
        }

        return true;
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
        $changePosFields = ["id", "pos", "parent_id"];
        checkFields($request, $changePosFields, true);

        $item_id = intval($request["id"]);
        $new_pos = intval($request["pos"]);
        $parent_id = intval($request["parent_id"]);
        if (!$item_id || !$new_pos) {
            return false;
        }

        $item = $this->getItem($item_id);
        if (!$item) {
            throw new \Error("Item not found");
        }

        $children = $this->findByParent($item_id);

        if ($item->parent_id !== $parent_id) {
            $item->parent_id = $parent_id;
            $category = (array)$item;

            $this->update($item_id, $category);
        }

        $this->updatePos($item_id, $new_pos);

        $pos = $new_pos;
        foreach ($children as $child) {
            $pos++;
            $this->updatePos($child->id, $pos);
        }

        $this->cleanCache();

        return true;
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
