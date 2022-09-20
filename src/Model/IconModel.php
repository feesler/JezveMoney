<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;
use JezveMoney\App\Item\IconItem;

use function JezveMoney\Core\qnull;

class IconModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    protected $tbl_name = "icon";
    protected $availTypes = [ICON_TILE => "Tile icon"];


    protected function onStart()
    {
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
        $res->file = $row["file"];
        $res->type = intval($row["type"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }


    // Called from CachedTable::updateCache() and return data query object
    protected function dataQuery()
    {
        return $this->dbObj->selectQ("*", $this->tbl_name);
    }


    protected function validateParams($params, $isUpdate = false)
    {
        $avFields = ["name", "file", "type"];
        $res = [];

        // In CREATE mode all fields is required
        if (!$isUpdate && !checkFields($params, $avFields)) {
            return null;
        }

        if (isset($params["name"])) {
            $res["name"] = $this->dbObj->escape($params["name"]);
            if (is_empty($res["name"])) {
                wlog("Invalid name specified");
                return null;
            }
        }

        if (isset($params["file"])) {
            $res["file"] = $this->dbObj->escape($params["file"]);
            if (is_empty($res["file"])) {
                wlog("Invalid file specified");
                return null;
            }
        }

        if (isset($params["type"])) {
            $res["type"] = intval($params["type"]);
        }

        return $res;
    }


    // Check same item already exist
    protected function isSameItemExist($params, $updateId = 0)
    {
        if (!is_array($params)) {
            return false;
        }

        $items = $this->getData(["type" => $params["type"], "file" => $params["file"]]);
        if (!count($items)) {
            return false;
        }
        $foundItem = $items[0];
        if ($foundItem->id != $updateId) {
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
            return null;
        }

        $res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }


    // Preparations for item update
    protected function preUpdate($item_id, $params)
    {
        // check currency is exist
        $currObj = $this->getItem($item_id);
        if (!$currObj) {
            return false;
        }

        $res = $this->validateParams($params, true);
        if (is_null($res)) {
            return null;
        }

        if ($this->isSameItemExist($res, $item_id)) {
            return null;
        }

        $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }


    // Check currency is in use
    public function isInUse($curr_id)
    {
        $curr_id = intval($curr_id);
        if (!$curr_id) {
            return false;
        }

        $qResult = $this->dbObj->selectQ("id", "account", "icon_id=" . $curr_id);
        if ($this->dbObj->rowsCount($qResult) > 0) {
            return true;
        }

        return false;
    }


    // Preparations for item delete
    protected function preDelete($items)
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


    // Return array of items
    public function getData($params = null)
    {
        if (is_null($params)) {
            $params = [];
        }

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


    // Return array of available types
    public function getTypes()
    {
        $res = [];
        foreach ($this->availTypes as $type_id => $typeName) {
            $res[$type_id] = $typeName;
        }

        return $res;
    }
}
