<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;
use JezveMoney\App\Item\ImportTemplateItem;

use function JezveMoney\Core\inSetCondition;

class ImportTemplateModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    private static $user_id = 0;
    private static $owner_id = 0;

    protected $tbl_name = "import_tpl";

    protected function onStart()
    {
        $this->dbObj = MySqlDB::getInstance();
        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();
        self::$owner_id = $uMod->getOwner();
        $this->accModel = AccountModel::getInstance();
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
        $res->account_id = intval($row["account_id"]);
        $res->first_row = intval($row["first_row"]);
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


    protected function validateParams($params, $item_id = 0)
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
            "account_id",
        ]);
        $res = [];

        // In CREATE mode all fields is required
        if (!$item_id) {
            checkFields($params, $avFields, true);
        }

        if (isset($params["name"]) || is_null($params["name"])) {
            $res["name"] = $this->dbObj->escape($params["name"]);
            if (is_empty($res["name"])) {
                throw new \Error("Invalid name specified");
            }
        }

        $res["type_id"] = (isset($params["type_id"])) ? intval($params["type_id"]) : 0;

        if (isset($params["account_id"])) {
            if (!is_numeric($params["account_id"])) {
                throw new \Error("Invalid account_id specified");
            }
            $res["account_id"] = intval($params["account_id"]);
        } else {
            $res["account_id"] = 0;
        }
        if ($res["account_id"] !== 0) {
            $account = $this->accModel->getItem($res["account_id"]);
            if (
                !$account
                || $account->user_id != self::$user_id
                || $account->owner_id != self::$owner_id
            ) {
                throw new \Error("Invalid account_id specified");
            }
        }

        if (isset($params["first_row"])) {
            $res["first_row"] = intval($params["first_row"]);
            if ($res["first_row"] < 1) {
                throw new \Error("Invalid first_row specified: " . $params["first_row"]);
            }
        }

        // Check column indexes data
        // All indexes is 1 based
        foreach ($columnFields as $fieldName) {
            if (isset($params[$fieldName])) {
                $res[$fieldName] = intval($params[$fieldName]);
                if ($res[$fieldName] < 1) {
                    throw new \Error("Invalid value for '$fieldName' specified: " . $params[$fieldName]);
                }
            }
        }

        if ($this->isSameItemExist($res, $item_id)) {
            throw new \Error("Same import template already exist");
        }

        return $res;
    }


    // Check same item already exist
    protected function isSameItemExist($params, $item_id = 0)
    {
        if (!is_array($params) || !isset($params["name"]) || !isset($params["type_id"])) {
            return false;
        }

        $items = $this->getData([
            "type" => $params["type_id"],
            "name" => $params["name"]
        ]);
        $foundItem = (count($items) > 0) ? $items[0] : null;
        return ($foundItem && $foundItem->id != $item_id);
    }


    // Preparations for item create
    protected function preCreate($params, $isMultiple = false)
    {
        $res = $this->validateParams($params);

        $res["user_id"] = self::$user_id;
        $res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");

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
        return [
            "accountAmount" => [
                "title" => __("COLUMN_ACCOUNT_AMOUNT"),
                "name" => "account_amount_col",
            ],
            "accountCurrency" => [
                "title" => __("COLUMN_ACCOUNT_CURRENCY"),
                "name" => "account_curr_col",
            ],
            "transactionAmount" => [
                "title" => __("COLUMN_TR_AMOUNT"),
                "name" => "trans_amount_col",
            ],
            "transactionCurrency" => [
                "title" => __("COLUMN_TR_CURRENCY"),
                "name" => "trans_curr_col",
            ],
            "date" => [
                "title" => __("COLUMN_DATE"),
                "name" => "date_col",
            ],
            "comment" => [
                "title" => __("COLUMN_COMMENT"),
                "name" => "comment_col",
            ]
        ];
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

    // Update templates with removed accounts
    public function onAccountDelete($accounts)
    {
        if (is_null($accounts)) {
            return false;
        }

        $updRes = $this->dbObj->updateQ(
            $this->tbl_name,
            ["account_id" => 0],
            "account_id" . inSetCondition($accounts)
        );
        if (!$updRes) {
            return false;
        }

        $this->cleanCache();

        return true;
    }
}
