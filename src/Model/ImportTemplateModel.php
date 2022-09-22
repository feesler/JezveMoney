<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;
use JezveMoney\App\Item\ImportTemplateItem;

use function JezveMoney\Core\qnull;

class ImportTemplateModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    private static $user_id = 0;

    protected $tbl_name = "import_tpl";
    protected $columnTypes = [
        "accountAmount" => ["title" => "Account amount", "name" => "account_amount_col"],
        "accountCurrency" => ["title" => "Account currency", "name" => "account_curr_col"],
        "transactionAmount" => ["title" => "Transaction amount", "name" => "trans_amount_col"],
        "transactionCurrency" => ["title" => "Transaction currency", "name" => "trans_curr_col"],
        "date" => ["title" => "Date", "name" => "date_col"],
        "comment" => ["title" => "Comment", "name" => "comment_col"]
    ];

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
        $res->columns = [
            "date" => intval($row["date_col"]),
            "comment" => intval($row["comment_col"]),
            "transactionCurrency" => intval($row["trans_curr_col"]),
            "transactionAmount" => intval($row["trans_amount_col"]),
            "accountCurrency" => intval($row["account_curr_col"]),
            "accountAmount" => intval($row["account_amount_col"]),
        ];
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }


    // Called from CachedTable::updateCache() and return data query object
    protected function dataQuery()
    {
        return $this->dbObj->selectQ("*", $this->tbl_name, "user_id=" . self::$user_id, null, "id ASC");
    }


    protected function validateParams($params, $isUpdate = false)
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


    // Check same item already exist
    protected function isSameItemExist($params, $updateId = 0)
    {
        if (!is_array($params)) {
            return false;
        }

        $items = $this->getData([
            "type" => $params["type_id"],
            "name" => $params["name"]
        ]);
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

        $ruleModel = ImportRuleModel::getInstance();
        return $ruleModel->onTemplateDelete($items);
    }


    // Return array of items
    public function getData($params = [])
    {
        if (!is_array($params)) {
            $params = [];
        }

        $res = [];
        if (!$this->checkCache()) {
            return $res;
        }

        $returnIds = isset($params["returnIds"]) ? $params["returnIds"] : false;
        $typeFilter = isset($params["type"]) ? intval($params["type"]) : 0;
        $nameFilter = isset($params["name"]) ? $params["name"] : null;

        foreach ($this->cache as $item) {
            if ($typeFilter && $item->type_id != $typeFilter) {
                continue;
            }
            if (!is_null($nameFilter) && $item->name != $nameFilter) {
                continue;
            }

            $res[] = ($returnIds) ? $item->id : (new ImportTemplateItem($item));
        }

        return $res;
    }

    // Return array of template column types
    public function getColumnTypes()
    {
        return $this->columnTypes;
    }

    // Delete all import templates of user
    public function reset()
    {
        if (!self::$user_id) {
            return false;
        }

        $items = $this->getData(["returnIds" => true]);
        $ruleModel = ImportRuleModel::getInstance();
        if (!$ruleModel->onTemplateDelete($items)) {
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
