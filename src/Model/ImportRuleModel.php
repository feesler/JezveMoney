<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;
use JezveMoney\App\Item\ImportRuleItem;

use function JezveMoney\Core\qnull;

// Rule field
define("IMPORT_RULE_FIELD_MAIN_ACCOUNT", 1);
define("IMPORT_RULE_FIELD_TPL", 2);
define("IMPORT_RULE_FIELD_TR_AMOUNT", 3);
define("IMPORT_RULE_FIELD_TR_CURRENCY", 4);
define("IMPORT_RULE_FIELD_ACC_AMOUNT", 5);
define("IMPORT_RULE_FIELD_ACC_CURRENCY", 6);
define("IMPORT_RULE_FIELD_COMMENT", 7);
define("IMPORT_RULE_FIELD_DATE", 8);

// Rule operators
define("IMPORT_RULE_OP_STRING_INCLUDES", 1);
define("IMPORT_RULE_OP_EQUAL", 2);
define("IMPORT_RULE_OP_NOT_EQUAL", 3);
define("IMPORT_RULE_OP_LESS", 4);
define("IMPORT_RULE_OP_GREATER", 5);
// Field flag of rule operator
// If operator include field flag, then value is field
define("IMPORT_RULE_OP_FIELD_FLAG", 0x8000);

class ImportRuleModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    private static $user_id = 0;

    protected $tbl_name = "import_rule";
    protected static $availRuleFields = [
        IMPORT_RULE_FIELD_MAIN_ACCOUNT,
        IMPORT_RULE_FIELD_TPL,
        IMPORT_RULE_FIELD_TR_AMOUNT,
        IMPORT_RULE_FIELD_TR_CURRENCY,
        IMPORT_RULE_FIELD_ACC_AMOUNT,
        IMPORT_RULE_FIELD_ACC_CURRENCY,
        IMPORT_RULE_FIELD_COMMENT,
        IMPORT_RULE_FIELD_DATE,
    ];
    protected static $ruleFieldNames = [
        IMPORT_RULE_FIELD_MAIN_ACCOUNT => "Main account",
        IMPORT_RULE_FIELD_TPL => "Import template",
        IMPORT_RULE_FIELD_TR_AMOUNT => "Transaction amount",
        IMPORT_RULE_FIELD_TR_CURRENCY => "Transaction currency",
        IMPORT_RULE_FIELD_ACC_AMOUNT => "Account amount",
        IMPORT_RULE_FIELD_ACC_CURRENCY => "Account currency",
        IMPORT_RULE_FIELD_COMMENT => "Comment",
        IMPORT_RULE_FIELD_DATE => "Date",
    ];

    protected static $availRuleOperators = [
        IMPORT_RULE_OP_STRING_INCLUDES,
        IMPORT_RULE_OP_EQUAL,
        IMPORT_RULE_OP_NOT_EQUAL,
        IMPORT_RULE_OP_LESS,
        IMPORT_RULE_OP_GREATER,
    ];
    protected static $ruleOperatorNames = [
        IMPORT_RULE_OP_STRING_INCLUDES => "Includes",
        IMPORT_RULE_OP_EQUAL => "Equal",
        IMPORT_RULE_OP_NOT_EQUAL => "Not equal",
        IMPORT_RULE_OP_LESS => "Less",
        IMPORT_RULE_OP_GREATER => "Greater",
    ];

    protected function onStart()
    {
        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();

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
        $res->user_id = intval($row["user_id"]);
        $res->parent_id = intval($row["parent_id"]);
        $res->field_id = intval($row["field_id"]);
        $res->operator = intval($row["operator"]);
        $res->value = $row["value"];
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
        $avFields = [
            "parent_id",
            "field_id",
            "operator",
            "value",
        ];
        $res = [];

        // In CREATE mode all fields is required
        if (!$isUpdate && !checkFields($params, $avFields)) {
            return null;
        }

        if (isset($params["parent_id"])) {
            $res["parent_id"] = intval($params["parent_id"]);
            if ($res["parent_id"] != 0 && !$this->isExist($res["parent_id"])) {
                wlog("Parent item not found: " . $res["parent_id"]);
                return null;
            }
        }

        if (isset($params["field_id"])) {
            $res["field_id"] = intval($params["field_id"]);
            if (!in_array($res["field_id"], self::$availRuleFields)) {
                wlog("Invalid field_id: " . $res["field_id"]);
                return null;
            }
        }

        if (isset($params["operator"])) {
            $res["operator"] = intval($params["operator"]);
            $unflagged = self::unflagOperator($res["operator"]);
            if (!in_array($unflagged, self::$availRuleOperators)) {
                wlog("Invalid operator: " . $res["operator"]);
                return null;
            }
        }

        if (isset($params["value"])) {
            $res["value"] = $this->dbObj->escape($params["value"]);
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
                "parent_id=" . qnull($res["parent_id"]),
                "field_id=" . qnull($res["field_id"]),
                "operator=" . qnull($res["operator"]),
                "value=" . qnull($res["value"])
            ]
        );
        if ($this->dbObj->rowsCount($qResult) > 0) {
            wlog("Such item already exist");
            return null;
        }

        $res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");
        $res["user_id"] = self::$user_id;

        return $res;
    }


    // Preparations for item update
    protected function preUpdate($item_id, $params)
    {
        // check item is exist
        $ruleObj = $this->getItem($item_id);
        if (!$ruleObj) {
            return false;
        }

        $res = $this->checkParams($params, true);
        if (is_null($res)) {
            return null;
        }

        if (isset($res["parent_id"]) && $res["parent_id"] == $ruleObj->id) {
            wlog("Rule can not be parent to itself");
            return null;
        }

        $qResult = $this->dbObj->selectQ(
            "*",
            $this->tbl_name,
            [
                "parent_id=" . qnull($res["parent_id"]),
                "field_id=" . qnull($res["field_id"]),
                "operator=" . qnull($res["operator"]),
                "value=" . qnull($res["value"])
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

            // Delete child rules
            $childRules = $this->getData(["parent" => $item_id]);
            $childIds = [];
            foreach ($childRules as $rule) {
                $childIds[] = $rule->id;
            }

            if (!$this->del($childIds)) {
                return false;
            }
        }

        return $this->actionModel->onDeleteRules($items);
    }


    // Return array of items
    public function getData($params = [])
    {
        if (!is_array($params)){
            $params = [];
        }

        $requestAll = (isset($params["full"]) && $params["full"] == true && UserModel::isAdminUser());
        $filterByParent = isset($params["parent"]);
        $parent_id = 0;
        if ($filterByParent) {
            $parent_id = intval($params["parent"]);
        }

        $itemsData = [];
        if ($requestAll) {
            $qResult = $this->dbObj->selectQ("*", $this->tbl_name, null, null, "id ASC");
            while ($row = $this->dbObj->fetchRow($qResult)) {
                $itemObj = $this->rowToObj($row);
                if ($itemObj) {
                    $itemsData[] = $itemObj;
                }
            }
        } else {
            if (!$this->checkCache()) {
                return null;
            }

            $itemsData = $this->cache;
        }

        $res = [];
        foreach ($itemsData as $item) {
            if ($filterByParent && $item->parent_id != $parent_id) {
                continue;
            }

            $itemObj = new ImportRuleItem($item, $requestAll);
            $res[] = $itemObj;
        }

        return $res;
    }


    public static function isFieldValueOperator($data)
    {
        return (intval($data) & IMPORT_RULE_OP_FIELD_FLAG) == IMPORT_RULE_OP_FIELD_FLAG;
    }


    public static function unflagOperator($data)
    {
        return intval($data) & ~IMPORT_RULE_OP_FIELD_FLAG;
    }


    public static function getFields()
    {
        return convertToObjectArray(self::$ruleFieldNames);
    }


    public static function getFieldName($field_id)
    {
        if (!isset(self::$ruleFieldNames[$field_id])) {
            return null;
        }

        return self::$ruleFieldNames[$field_id];
    }


    public static function getOperators()
    {
        return convertToObjectArray(self::$ruleOperatorNames);
    }


    public static function getOperatorName($operator_id)
    {
        $operator_id = self::unflagOperator($operator_id);
        if (!isset(self::$ruleOperatorNames[$operator_id])) {
            return null;
        }

        return self::$ruleOperatorNames[$operator_id];
    }
}
