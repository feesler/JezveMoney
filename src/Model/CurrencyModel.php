<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;
use JezveMoney\App\Item\CurrencyItem;

use function JezveMoney\Core\orJoin;
use function JezveMoney\Core\qnull;

class CurrencyModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    protected $tbl_name = "currency";


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
        $res->sign = $row["sign"];
        $res->flags = intval($row["flags"]);
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
        $avFields = ["name", "sign", "flags"];
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

        if (isset($params["sign"])) {
            $res["sign"] = $this->dbObj->escape($params["sign"]);
            if (is_empty($res["sign"])) {
                wlog("Invalid sign specified");
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

        $qResult = $this->dbObj->selectQ("id", "account", "curr_id=" . $curr_id);
        if ($this->dbObj->rowsCount($qResult) > 0) {
            return true;
        }

        $qResult = $this->dbObj->selectQ(
            "id",
            "transactions",
            orJoin(["src_curr=" . $curr_id, "dest_curr=" . $curr_id])
        );
        if ($this->dbObj->rowsCount($qResult) > 0) {
            return true;
        }

        return false;
    }


    // Preparations for item delete
    protected function preDelete($items)
    {
        foreach ($items as $item_id) {
            // check currency is exist
            $currObj = $this->getItem($item_id);
            if (!$currObj) {
                return false;
            }

            // don't delete currencies in use
            if ($this->isInUse($item_id)) {
                return false;
            }
        }

        return true;
    }


    // Format value in specified currency
    public function format($value, $curr_id)
    {
        $currObj = $this->getItem($curr_id);
        if (!$currObj) {
            return null;
        }

        $sfmt = (($currObj->flags) ? ($currObj->sign . " %s") : ("%s " . $currObj->sign));
        return valFormat($sfmt, $value);
    }


    // Return array of currencies
    public function getData()
    {
        $res = [];

        if (!$this->checkCache()) {
            return $res;
        }

        foreach ($this->cache as $item) {
            $currObj = new CurrencyItem($item);
            $res[] = $currObj;
        }

        return $res;
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
