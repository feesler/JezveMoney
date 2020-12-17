<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;

use function JezveMoney\Core\qnull;

class ImportTemplateModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    private static $user_id = 0;

    protected $tbl_name = "import_tpl";


    protected function onStart()
    {
        $this->dbObj = MySqlDB::getInstance();
        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();
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
        $res->user_id = intval($row["user_id"]);
        $res->type_id = intval($row["type_id"]);
        $res->dateColumn = intval($row["date_col"]);
        $res->commentColumn = intval($row["comment_col"]);
        $res->transactionCurrColumn = intval($row["trans_curr_col"]);
        $res->transactionAmountColumn = intval($row["trans_amount_col"]);
        $res->accountCurrColumn = intval($row["account_curr_col"]);
        $res->accountAmountColumn = intval($row["account_amount_col"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }


    // Called from CachedTable::updateCache() and return data query object
    protected function dataQuery()
    {
        return $this->dbObj->selectQ("*", $this->tbl_name, "user_id=" . self::$user_id, null, "id ASC");
    }


    protected function checkParams($params, $isUpdate = false)
    {
        $columnFields = [
            "date_col",
            "comment_col",
            "trans_curr_col",
            "trans_amount_col",
            "account_curr_col",
            "account_amount_col",
        ];
        $avFields = array_merge($columnFields, [
            "name",
            "type_id",
        ]);
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

        if (isset($params["type_id"])) {
            $res["type_id"] = intval($params["type_id"]);
        } else {
            $res["type_id"] = 0;
        }

        // Check column indexes data
        // All indexes is 1 based
        foreach ($columnFields as $fieldName) {
            if (isset($params[$fieldName])) {
                $res[$fieldName] = intval($params[$fieldName]);
                if ($res[$fieldName] < 1) {
                    wlog("Invalid value for '$fieldName' specified: " . $params[$fieldName]);
                    return null;
                }
            }
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

        $qResult = $this->dbObj->selectQ(
            "*",
            $this->tbl_name,
            [
                "name=" . qnull($res["name"]),
                "type_id=" . qnull($res["type_id"]),
                "user_id=" . qnull(self::$user_id)
            ]
        );
        if ($this->dbObj->rowsCount($qResult) > 0) {
            wlog("Such item already exist");
            return null;
        }

        $res["user_id"] = self::$user_id;
        $res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }


    // Preparations for item update
    protected function preUpdate($item_id, $params)
    {
        // check currency is exist
        $item = $this->getItem($item_id);
        if (!$item) {
            return false;
        }

        // check user of template
        if ($item->user_id != self::$user_id) {
            wlog("Invalid user of item");
            return false;
        }

        $res = $this->checkParams($params, true);
        if (is_null($res)) {
            return null;
        }

        $qResult = $this->dbObj->selectQ(
            "*",
            $this->tbl_name,
            [
                "name=" . qnull($res["name"]),
                "type_id=" . qnull($res["type_id"]),
                "user_id=" . qnull(self::$user_id)
            ]
        );
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


    // Preparations for item delete
    protected function preDelete($items)
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


    // Return array of items
    public function getData()
    {
        $res = [];

        if (!$this->checkCache()) {
            return $res;
        }

        foreach ($this->cache as $item) {
            $itemObj = new \stdClass();

            $itemObj->id = $item->id;
            $itemObj->name = $item->name;
            $itemObj->type_id = $item->type_id;
            $itemObj->dateColumn = $item->dateColumn;
            $itemObj->commentColumn = $item->commentColumn;
            $itemObj->transactionCurrColumn = $item->transactionCurrColumn;
            $itemObj->transactionAmountColumn = $item->transactionAmountColumn;
            $itemObj->accountCurrColumn = $item->accountCurrColumn;
            $itemObj->accountAmountColumn = $item->accountAmountColumn;

            $res[] = $itemObj;
        }

        return $res;
    }
}
