<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;
use JezveMoney\App\Item\IconItem;

/**
 * Icon model
 */
class IconModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    protected $tbl_name = "icon";
    protected $availTypes = [ICON_TILE => "Tile icon"];

    /**
     * Model initialization
     */
    protected function onStart()
    {
        $this->dbObj = MySqlDB::getInstance();
    }

    /**
     * Converts table row from database to object
     *
     * @param array $row array of table row fields
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
        $res->name = $row["name"];
        $res->file = $row["file"];
        $res->type = intval($row["type"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }

    /**
     * Returns data query object for CachedTable::updateCache()
     *
     * @return \mysqli_result|bool
     */
    protected function dataQuery()
    {
        return $this->dbObj->selectQ("*", $this->tbl_name);
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
        $avFields = ["name", "file", "type"];
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

        if (isset($params["file"])) {
            $res["file"] = $this->dbObj->escape($params["file"]);
            if (is_empty($res["file"])) {
                throw new \Error("Invalid file specified");
            }
        }

        if (isset($params["type"])) {
            $res["type"] = intval($params["type"]);
        }

        if ($this->isSameItemExist($res, $item_id)) {
            throw new \Error("Same icon already exist");
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
        if (!is_array($params) || !isset($params["type"]) || !isset($params["file"])) {
            return false;
        }

        $items = $this->getData(["type" => $params["type"], "file" => $params["file"]]);
        $foundItem = (count($items) > 0) ? $items[0] : null;
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

        $res = $this->validateParams($params, $item_id);
        $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }

    /**
     * Returns true if icon is in use by other models
     *
     * @param int $item_id icon id
     *
     * @return bool
     */
    public function isInUse($item_id)
    {
        $item_id = intval($item_id);
        if (!$item_id) {
            return false;
        }

        $qResult = $this->dbObj->selectQ("id", "account", "icon_id=" . $item_id);
        if ($this->dbObj->rowsCount($qResult) > 0) {
            return true;
        }

        return false;
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

            // don't delete items in use
            if ($this->isInUse($item_id)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Returns array of icons
     *
     * @param array $params array of options:
     *     - 'type' => (int) - select icons by type
     *     - 'file' => (string) - select icons by file
     *
     * @return IconItem[]
     */
    public function getData(array $params = [])
    {
        $typeFilter = isset($params["type"]) ? intval($params["type"]) : null;
        $fileFilter = isset($params["file"]) ? $params["file"] : null;

        $res = [];

        if (!$this->checkCache()) {
            return $res;
        }

        foreach ($this->cache as $item) {
            if (!is_null($typeFilter) && $item->type != $typeFilter) {
                continue;
            }
            if (!is_null($fileFilter) && $item->file != $fileFilter) {
                continue;
            }

            $itemObj = new IconItem($item);

            $res[] = $itemObj;
        }

        return $res;
    }

    /**
     * Returns array of available icon types
     *
     * @return array
     */
    public function getTypes()
    {
        $res = [];
        foreach ($this->availTypes as $type_id => $typeName) {
            $res[$type_id] = $typeName;
        }

        return $res;
    }
}
