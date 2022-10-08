<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;
use JezveMoney\App\Item\ImportConditionItem;

use function JezveMoney\Core\qnull;

// Rule field
define("IMPORT_COND_FIELD_MAIN_ACCOUNT", 1);
define("IMPORT_COND_FIELD_TPL", 2);
define("IMPORT_COND_FIELD_TR_AMOUNT", 3);
define("IMPORT_COND_FIELD_TR_CURRENCY", 4);
define("IMPORT_COND_FIELD_ACC_AMOUNT", 5);
define("IMPORT_COND_FIELD_ACC_CURRENCY", 6);
define("IMPORT_COND_FIELD_COMMENT", 7);
define("IMPORT_COND_FIELD_DATE", 8);
// Rule operators
define("IMPORT_COND_OP_STRING_INCLUDES", 1);
define("IMPORT_COND_OP_EQUAL", 2);
define("IMPORT_COND_OP_NOT_EQUAL", 3);
define("IMPORT_COND_OP_LESS", 4);
define("IMPORT_COND_OP_GREATER", 5);
// Rule flags
define("IMPORT_COND_OP_FIELD_FLAG", 0x01);

class ImportConditionModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    private static $user_id = 0;

    protected $tbl_name = "import_cond";
    protected static $availCondFields = [
        IMPORT_COND_FIELD_MAIN_ACCOUNT,
        IMPORT_COND_FIELD_TPL,
        IMPORT_COND_FIELD_TR_AMOUNT,
        IMPORT_COND_FIELD_TR_CURRENCY,
        IMPORT_COND_FIELD_ACC_AMOUNT,
        IMPORT_COND_FIELD_ACC_CURRENCY,
        IMPORT_COND_FIELD_COMMENT,
        IMPORT_COND_FIELD_DATE,
    ];
    protected static $condFieldNames = [
        IMPORT_COND_FIELD_MAIN_ACCOUNT => "Main account",
        IMPORT_COND_FIELD_TPL => "Import template",
        IMPORT_COND_FIELD_TR_AMOUNT => "Transaction amount",
        IMPORT_COND_FIELD_TR_CURRENCY => "Transaction currency",
        IMPORT_COND_FIELD_ACC_AMOUNT => "Account amount",
        IMPORT_COND_FIELD_ACC_CURRENCY => "Account currency",
        IMPORT_COND_FIELD_COMMENT => "Comment",
        IMPORT_COND_FIELD_DATE => "Date",
    ];

    protected static $availCondOperators = [
        IMPORT_COND_OP_STRING_INCLUDES,
        IMPORT_COND_OP_EQUAL,
        IMPORT_COND_OP_NOT_EQUAL,
        IMPORT_COND_OP_LESS,
        IMPORT_COND_OP_GREATER,
    ];
    protected static $condOperatorNames = [
        IMPORT_COND_OP_STRING_INCLUDES => "Includes",
        IMPORT_COND_OP_EQUAL => "Equal",
        IMPORT_COND_OP_NOT_EQUAL => "Not equal",
        IMPORT_COND_OP_LESS => "Less",
        IMPORT_COND_OP_GREATER => "Greater",
    ];

    protected function onStart()
    {
        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();

        $this->dbObj = MySqlDB::getInstance();
        $this->ruleModel = ImportRuleModel::getInstance();
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
        $res->rule_id = intval($row["rule_id"]);
        $res->field_id = intval($row["field_id"]);
        $res->operator = intval($row["operator"]);
        $res->flags = intval($row["flags"]);
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


    protected function validateParams($params, $item_id = 0)
    {
        $avFields = [
            "rule_id",
            "field_id",
            "operator",
            "value",
            "flags"
        ];
        $res = [];

        // In CREATE mode all fields is required
        if (!$item_id) {
            checkFields($params, $avFields, true);
        }

        if (isset($params["rule_id"])) {
            $res["rule_id"] = intval($params["rule_id"]);
            if (!$this->ruleModel->isExist($res["rule_id"])) {
                throw new \Error("Parent rule not found: " . $res["rule_id"]);
            }
        }

        if (isset($params["field_id"])) {
            $res["field_id"] = intval($params["field_id"]);
            if (!in_array($res["field_id"], self::$availCondFields)) {
                throw new \Error("Invalid field_id: " . $res["field_id"]);
            }
        }

        if (isset($params["operator"])) {
            $res["operator"] = intval($params["operator"]);
            if (!in_array($res["operator"], self::$availCondOperators)) {
                throw new \Error("Invalid operator: " . $res["operator"]);
            }
        }

        if (isset($params["flags"])) {
            $res["flags"] = intval($params["flags"]);
        }

        if (isset($params["value"])) {
            $res["value"] = $this->dbObj->escape($params["value"]);
        }

        if ($this->isSameItemExist($res, $item_id)) {
            throw new \Error("Same import condition already exist");
        }

        return $res;
    }


    // Check same item already exist
    protected function isSameItemExist($params, $item_id = 0)
    {
        if (!is_array($params)) {
            return false;
        }

        $items = $this->getData([
            "rule" => $params["rule_id"],
            "field" => $params["field_id"],
            "operator" => $params["operator"],
            "value" => $params["value"]
        ]);
        $foundItem = (count($items) > 0) ? $items[0] : null;
        return ($foundItem && $foundItem->id != $item_id);
    }


    // Preparations for item create
    protected function preCreate($params, $isMultiple = false)
    {
        $res = $this->validateParams($params);

        $res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");
        $res["user_id"] = self::$user_id;

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

        return true;
    }


    // Return array of items
    public function getData($params = [])
    {
        if (!is_array($params)) {
            $params = [];
        }

        $requestAll = (isset($params["full"]) && $params["full"] == true && UserModel::isAdminUser());
        $ruleFilter = isset($params["rule"]) ? intval($params["rule"]) : 0;
        $fieldFilter = isset($params["field"]) ? intval($params["field"]) : 0;
        $operatorFilter = isset($params["operator"]) ? intval($params["operator"]) : 0;
        $valueFilter = isset($params["value"]) ? $params["value"] : null;

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
            if ($ruleFilter && $item->rule_id != $ruleFilter) {
                continue;
            }
            if ($fieldFilter && $item->field_id != $fieldFilter) {
                continue;
            }
            if ($operatorFilter && $item->operator != $operatorFilter) {
                continue;
            }
            if (!is_null($valueFilter) && $item->value != $valueFilter) {
                continue;
            }

            $itemObj = new ImportConditionItem($item, $requestAll);

            $res[] = $itemObj;
        }

        return $res;
    }

    // Return array of conditions of specified rule
    public function getRuleConditions($rule_id)
    {
        return $this->getData(["rule" => $rule_id]);
    }

    // Set conditions for specified rule
    // Delete all previous conditions for rule
    public function setRuleConditions($rule_id, $conditions)
    {
        $rule_id = intval($rule_id);
        if (!$rule_id) {
            return false;
        }

        if (!$this->deleteRuleConditions($rule_id)) {
            return false;
        }

        $conditions = asArray($conditions);
        foreach ($conditions as $condition) {
            $condition["rule_id"] = $rule_id;
            if (!$this->create($condition)) {
                return false;
            }
        }

        return true;
    }

    // Delete all conditions of specified rules
    public function deleteRuleConditions($rules)
    {
        if (is_null($rules)) {
            return;
        }
        $rules = asArray($rules);

        if (!$this->checkCache()) {
            return false;
        }

        $itemsToDelete = [];
        foreach ($this->cache as $item_id => $item) {
            if (in_array($item->rule_id, $rules)) {
                $itemsToDelete[] = $item_id;
            }
        }

        return $this->del($itemsToDelete);
    }

    // Delete all conditions for specified templates
    public function deleteTemplateConditions($templates)
    {
        if (is_null($templates)) {
            return;
        }
        $templates = asArray($templates);

        if (!$this->checkCache()) {
            return false;
        }

        $itemsToDelete = [];
        foreach ($this->cache as $item_id => $item) {
            if (
                $item->field_id === IMPORT_COND_FIELD_TPL
                && in_array($item->value, $templates)
            ) {
                $itemsToDelete[] = $item_id;
            }
        }

        return $this->del($itemsToDelete);
    }

    // Delete all conditions for specified accounts
    public function deleteAccountConditions($accounts)
    {
        if (is_null($accounts)) {
            return;
        }
        $accounts = asArray($accounts);

        if (!$this->checkCache()) {
            return false;
        }

        $itemsToDelete = [];
        foreach ($this->cache as $item_id => $item) {
            if (
                $item->field_id === IMPORT_COND_FIELD_MAIN_ACCOUNT
                && in_array($item->value, $accounts)
            ) {
                $itemsToDelete[] = $item_id;
            }
        }

        return $this->del($itemsToDelete);
    }


    public static function isPropertyValue($data)
    {
        return (intval($data) & IMPORT_COND_OP_FIELD_FLAG) == IMPORT_COND_OP_FIELD_FLAG;
    }


    public static function getFields()
    {
        return convertToObjectArray(self::$condFieldNames);
    }


    public static function getFieldName($field_id)
    {
        if (!isset(self::$condFieldNames[$field_id])) {
            return null;
        }

        return self::$condFieldNames[$field_id];
    }


    public static function getOperators()
    {
        return convertToObjectArray(self::$condOperatorNames);
    }


    public static function getOperatorName($operator_id)
    {
        $operator_id = intval($operator_id);
        if (!isset(self::$condOperatorNames[$operator_id])) {
            return null;
        }

        return self::$condOperatorNames[$operator_id];
    }
}
