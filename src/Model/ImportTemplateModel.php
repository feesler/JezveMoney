<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;
use JezveMoney\App\Item\ImportTemplateItem;

use function JezveMoney\Core\inSetCondition;

/**
 * Import template model
 */
class ImportTemplateModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    private static $user_id = 0;
    private static $owner_id = 0;

    protected $tbl_name = "import_tpl";
    protected $accModel = null;

    /**
     * Model initialization
     */
    protected function onStart()
    {
        $this->dbObj = MySqlDB::getInstance();
        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();
        self::$owner_id = $uMod->getOwner();
        $this->accModel = AccountModel::getInstance();
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

        $res["user_id"] = self::$user_id;
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
        if ($item->user_id != self::$user_id) {
            throw new \Error("Invalid user");
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

        $ruleModel = ImportRuleModel::getInstance();
        return $ruleModel->onTemplateDelete($items);
    }

    /**
     * Returns array of import templates
     *
     * @param array $params array of options:
     *     - 'returnIds' => (bool) - returns ids instead of objects, default is false
     *     - 'type' => (int) - select templates by type, default is 0
     *     - 'name' => (int) - select template by name, default is null
     *
     * @return ImportTemplateItem[]|int[]
     */
    public function getData(array $params = [])
    {
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

    /**
     * Returns array of template column types
     *
     * @return array
     */
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

    /**
     * Removes all import templates of user
     *
     * @return bool
     */
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

    /**
     * Handles account delete event
     * Removes templates with removed accounts
     *
     * @param mixed $accounts id or array of account ids
     *
     * @return bool
     */
    public function onAccountDelete(mixed $accounts)
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
