<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;
use JezveMoney\App\Item\ImportActionItem;

use function JezveMoney\Core\qnull;

// Action types
// Consider not to change date
define("IMPORT_ACTION_SET_TR_TYPE", 1);
define("IMPORT_ACTION_SET_ACCOUNT", 2);
define("IMPORT_ACTION_SET_PERSON", 3);
define("IMPORT_ACTION_SET_SRC_AMOUNT", 4);
define("IMPORT_ACTION_SET_DEST_AMOUNT", 5);
define("IMPORT_ACTION_SET_COMMENT", 6);

class ImportActionModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    private static $user_id = 0;

    protected $tbl_name = "import_act";
    protected static $availActions = [
        IMPORT_ACTION_SET_TR_TYPE,
        IMPORT_ACTION_SET_ACCOUNT,
        IMPORT_ACTION_SET_PERSON,
        IMPORT_ACTION_SET_SRC_AMOUNT,
        IMPORT_ACTION_SET_DEST_AMOUNT,
        IMPORT_ACTION_SET_COMMENT,
    ];

    protected static $actionNames = [
        IMPORT_ACTION_SET_TR_TYPE => "Set transaction type",
        IMPORT_ACTION_SET_ACCOUNT => "Set account",
        IMPORT_ACTION_SET_PERSON => "Set person",
        IMPORT_ACTION_SET_SRC_AMOUNT => "Set source amount",
        IMPORT_ACTION_SET_DEST_AMOUNT => "Set destination amount",
        IMPORT_ACTION_SET_COMMENT => "Set comment",
    ];

    protected function onStart()
    {
        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();

        $this->dbObj = MySqlDB::getInstance();
        $this->accModel = AccountModel::getInstance();
        $this->personModel = PersonModel::getInstance();
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
        $res->action_id = intval($row["action_id"]);
        $res->value = $row["value"];
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
        $avFields = [
            "rule_id",
            "action_id",
            "value",
        ];
        $res = [];

        // In CREATE mode all fields is required
        if (!$isUpdate && !checkFields($params, $avFields)) {
            return null;
        }

        if (isset($params["rule_id"])) {
            $res["rule_id"] = intval($params["rule_id"]);
            if (!$this->ruleModel->isExist($res["rule_id"])) {
                wlog("Invalid rule_id: " . $params["rule_id"]);
                return null;
            }
        }

        if (isset($params["action_id"])) {
            $res["action_id"] = intval($params["action_id"]);
            if (!in_array($res["action_id"], self::$availActions)) {
                wlog("Invalid action: " . $res["action_id"]);
                return null;
            }
        }

        if (isset($params["value"])) {
            $res["value"] = $this->dbObj->escape($params["value"]);
        }

        return $res;
    }


    protected function validateAction($actionId, $value)
    {
        $action = intval($actionId);
        if (!in_array($action, self::$availActions)) {
            wlog("Invalid action: " . $actionId);
            return false;
        }

        if ($action == IMPORT_ACTION_SET_TR_TYPE) {
            $transactionType = intval($value);
            if (is_null(TransactionModel::typeToString($transactionType))) {
                wlog("Invalid transaction type: " . $value);
                return false;
            }
        } elseif ($action == IMPORT_ACTION_SET_ACCOUNT) {
            $accountId = intval($value);
            if (!$this->accModel->isExist($accountId)) {
                wlog("Invalid account id: " . $value);
                return false;
            }
        } elseif ($action == IMPORT_ACTION_SET_PERSON) {
            $personId = intval($value);
            if (!$this->personModel->isExist($personId)) {
                wlog("Invalid person id: " . $value);
                return false;
            }
        } elseif (
            $action == IMPORT_ACTION_SET_SRC_AMOUNT
            || $action == IMPORT_ACTION_SET_SRC_AMOUNT
        ) {
            $amount = floatval($value);
            if ($amount == 0.0) {
                wlog("Invalid amount: " . $value);
                return false;
            }
        }

        return true;
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
                "user_id=" . qnull(self::$user_id),
                "rule_id=" . qnull($res["rule_id"]),
                "action_id=" . qnull($res["action_id"]),
            ]
        );
        if ($this->dbObj->rowsCount($qResult) > 0) {
            wlog("Such item already exist");
            return null;
        }

        if (!$this->validateAction($res["action_id"], $res["value"])) {
            wlog("Invalid import action");
            return null;
        }

        $res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");
        $res["user_id"] = self::$user_id;

        return $res;
    }


    // Preparations for item update
    protected function preUpdate($item_id, $params)
    {
        // check currency is exist
        $actionObj = $this->getItem($item_id);
        if (!$actionObj) {
            return false;
        }

        // check user of account
        if ($actionObj->user_id != self::$user_id) {
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
                "user_id=" . qnull(self::$user_id),
                "rule_id=" . qnull($res["rule_id"]),
                "action_id=" . qnull($res["action_id"]),
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

        $targetAction = isset($res["action_id"]) ? $res["action_id"] : $actionObj->action;
        $targetValue = isset($res["value"]) ? $res["value"] : $actionObj->value;

        if (!$this->validateAction($targetAction, $targetValue)) {
            wlog("Invalid import action");
            return null;
        }

        $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }


    // Check currency is in use
    public function isInUse($item_id)
    {
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
        }

        return true;
    }


    // Return array of items
    public function getData($params = [])
    {
        if (!is_array($params)){
            $params = [];
        }

        $requestAll = (isset($params["full"]) && $params["full"] == true && UserModel::isAdminUser());
        $filterByRule = isset($params["rule"]);
        $rule_id = 0;
        if ($filterByRule) {
            $rule_id = intval($params["rule"]);
            if (!$rule_id) {
                wlog("Invalid rule id: ".$params["rule"]);
                return null;
            }
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
            if ($filterByRule && $item->rule_id != $rule_id) {
                continue;
            }

            $itemObj = new ImportActionItem($item, $requestAll);
            $res[] = $itemObj;
        }

        return $res;
    }


    public function onRuleDelete($rules)
    {
        if (is_null($rules)) {
            return;
        }
        if (!is_array($rules)) {
            $rules = [$rules];
        }

        if (!$this->checkCache()) {
            return false;
        }

        $itemsToDel = [];
        foreach ($this->cache as $item_id => $item) {
            if (in_array($item->rule_id, $rules)) {
                $itemsToDel[] = $item_id;
            }
        }

        return $this->del($itemsToDel);
    }


    public static function getActions()
    {
        return convertToObjectArray(self::$actionNames);
    }


    public static function getActionName($action_id)
    {
        if (!isset(self::$actionNames[$action_id])) {
            return null;
        }

        return self::$actionNames[$action_id];
    }
}
