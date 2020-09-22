<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;

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


    protected function checkParams($params, $isUpdate = false)
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


    // Preparations for item create
    protected function preCreate($params, $isMultiple = false)
    {
        $res = $this->checkParams($params);
        if (is_null($res)) {
            return null;
        }

        $qResult = $this->dbObj->selectQ("*", $this->tbl_name, "name=" . qnull($res["name"]));
        if ($this->dbObj->rowsCount($qResult) > 0) {
            wlog("Such item already exist");
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

        $res = $this->checkParams($params, true);
        if (is_null($res)) {
            return null;
        }

        $qResult = $this->dbObj->selectQ("*", $this->tbl_name, "name=" . qnull($res["name"]));
        $row = $this->dbObj->fetchRow($qResult);
        if ($row) {
            $found_id = intval($row["id"]);
            if ($found_id != $item_id) {
                wlog("Such item already exist");
                return null;
            }
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

        $qResult = $this->dbObj->selectQ("id", "transactions", "curr_id=" . $curr_id);
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

        foreach ($this->cache as $curr_id => $item) {
            $currObj = new \stdClass();

            $currObj->id = $item->id;
            $currObj->name = $item->name;
            $currObj->sign = $item->sign;
            $currObj->flags = $item->flags;

            $res[] = $currObj;
        }

        return $res;
    }
}
