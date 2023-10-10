<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\App\Item\ColorItem;

/**
 * Color model
 */
class ColorModel extends CachedTable
{
    use Singleton;

    protected $tbl_name = "colors";

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
     * @param array|null $row array of table row fields
     *
     * @return ColorItem|null
     */
    protected function rowToObj(?array $row)
    {
        return ColorItem::fromTableRow($row);
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
        $avFields = ["value", "type"];
        $res = [];

        // In CREATE mode all fields is required
        if (!$item_id) {
            checkFields($params, $avFields, true);
        }

        if (isset($params["value"])) {
            if (!is_string($params["value"]) || strlen($params["value"]) !== 7) {
                throw new \Error("Invalid color value");
            }

            $requestedColor = strtolower($params["value"]);
            $res["value"] = colorToInt($requestedColor);
            $resColor = intToColor($res["value"]);
            if ($requestedColor !== $resColor) {
                throw new \Error("Invalid color specified");
            }
        }

        if (isset($params["type"])) {
            $res["type"] = intval($params["type"]);
        }

        if ($this->isSameItemExist($res, $item_id)) {
            throw new \Error("Same color already exist");
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
        if (!is_array($params) || !isset($params["type"]) || !isset($params["value"])) {
            return false;
        }

        $items = $this->getData(["type" => $params["type"], "value" => $params["value"]]);
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
        }

        return true;
    }

    /**
     * Returns array of colors
     *
     * @param array $params array of options:
     *     - 'value' => (int) - select color by value
     *     - 'type' => (int) - select colors by type
     *
     * @return ColorItem[]
     */
    public function getData(array $params = [])
    {
        $valueFilter = isset($params["value"]) ? intToColor(intval($params["value"])) : null;
        $typeFilter = isset($params["type"]) ? intval($params["type"]) : null;

        $res = [];

        if (!$this->checkCache()) {
            return $res;
        }

        foreach ($this->cache as $item) {
            if (!is_null($typeFilter) && $item->type != $typeFilter) {
                continue;
            }
            if (!is_null($valueFilter) && $item->value != $valueFilter) {
                continue;
            }

            $res[] = $item;
        }

        return $res;
    }
}
