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
define("IMPORT_ACTION_SET_CATEGORY", 7);

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
        IMPORT_ACTION_SET_CATEGORY,
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


    protected function validateParams($params, $item_id = 0)
    {
        $avFields = [
            "rule_id",
            "action_id",
            "value",
        ];
        $res = [];

        // In CREATE mode all fields is required
        if (!$item_id) {
            checkFields($params, $avFields, true);
        }

        if (isset($params["rule_id"])) {
            $res["rule_id"] = intval($params["rule_id"]);
            if (!$this->ruleModel->isExist($res["rule_id"])) {
                throw new \Error("Invalid rule_id: " . $params["rule_id"]);
            }
        }

        if (isset($params["action_id"])) {
            $res["action_id"] = intval($params["action_id"]);
            if (!in_array($res["action_id"], self::$availActions)) {
                throw new \Error("Invalid action: " . $res["action_id"]);
            }
        }

        if (isset($params["value"])) {
            $res["value"] = $this->dbObj->escape($params["value"]);
        }

        if ($this->isSameItemExist($res, $item_id)) {
            throw new \Error("Same import action already exist");
        }

        return $res;
    }


    protected function validateAction($actionId, $value)
    {
        $importTransactionTypes = [
            "expense",
            "income",
            "transferfrom",
            "transferto",
            "debtfrom",
            "debtto"
        ];

        $action = intval($actionId);
        if (!in_array($action, self::$availActions)) {
            throw new \Error("Invalid action: " . $actionId);
        }

        if ($action == IMPORT_ACTION_SET_TR_TYPE) {
            if (!in_array(strtolower($value), $importTransactionTypes)) {
                throw new \Error("Invalid transaction type: " . $value);
            }
        } elseif ($action == IMPORT_ACTION_SET_ACCOUNT) {
            $accountId = intval($value);
            if (!$this->accModel->isExist($accountId)) {
                throw new \Error("Invalid account id: " . $value);
            }
        } elseif ($action == IMPORT_ACTION_SET_PERSON) {
            $personId = intval($value);
            if (!$this->personModel->isExist($personId)) {
                throw new \Error("Invalid person id: " . $value);
            }
        } elseif (
            $action == IMPORT_ACTION_SET_SRC_AMOUNT
            || $action == IMPORT_ACTION_SET_SRC_AMOUNT
        ) {
            $amount = floatval($value);
            if ($amount == 0.0) {
                throw new \Error("Invalid amount: " . $value);
            }
        }
    }


    // Check same item already exist
    protected function isSameItemExist($params, $item_id = 0)
    {
        if (!is_array($params) || !isset($params["rule_id"]) || !isset($params["action_id"])) {
            return false;
        }

        $items = $this->getData([
            "rule" => $params["rule_id"],
            "action" => $params["action_id"]
        ]);
        $foundItem = (count($items) > 0) ? $items[0] : null;
        return ($foundItem && $foundItem->id != $item_id);
    }


    // Preparations for item create
    protected function preCreate($params, $isMultiple = false)
    {
        $res = $this->validateParams($params);

        $this->validateAction($res["action_id"], $res["value"]);

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

        $targetAction = isset($res["action_id"]) ? $res["action_id"] : $item->action;
        $targetValue = isset($res["value"]) ? $res["value"] : $item->value;

        $this->validateAction($targetAction, $targetValue);

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
        $actionFilter = isset($params["action"]) ? intval($params["action"]) : 0;

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
            if ($actionFilter && $item->action_id != $actionFilter) {
                continue;
            }

            $itemObj = new ImportActionItem($item, $requestAll);
            $res[] = $itemObj;
        }

        return $res;
    }


    public function getRuleActions($rule_id)
    {
        return $this->getData(["rule" => $rule_id]);
    }

    // Set actions for specified rule
    // Delete all previous actions for rule
    public function setRuleActions($rule_id, $actions)
    {
        $rule_id = intval($rule_id);
        if (!$rule_id) {
            return false;
        }

        if (!$this->deleteRuleActions($rule_id)) {
            return false;
        }

        $actions = asArray($actions);
        foreach ($actions as $action) {
            $action["rule_id"] = $rule_id;
            if (!$this->create($action)) {
                return false;
            }
        }

        return true;
    }

    // Delete all actions of specified rules
    public function deleteRuleActions($rules)
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

    // Delete all actions for specified accounts
    public function deleteAccountActions($accounts)
    {
        if (is_null($accounts)) {
            return false;
        }
        $accounts = asArray($accounts);

        if (!$this->checkCache()) {
            return false;
        }

        $itemsToDelete = [];
        foreach ($this->cache as $item_id => $item) {
            if (
                $item->action_id === IMPORT_ACTION_SET_ACCOUNT
                && in_array($item->value, $accounts)
            ) {
                $itemsToDelete[] = $item_id;
            }
        }

        return $this->del($itemsToDelete);
    }

    // Delete all actions for specified persons
    public function deletePersonActions($persons)
    {
        if (is_null($persons)) {
            return false;
        }
        $persons = asArray($persons);

        if (!$this->checkCache()) {
            return false;
        }

        $itemsToDelete = [];
        foreach ($this->cache as $item_id => $item) {
            if (
                $item->action_id === IMPORT_ACTION_SET_PERSON
                && in_array($item->value, $persons)
            ) {
                $itemsToDelete[] = $item_id;
            }
        }

        return $this->del($itemsToDelete);
    }

    // Delete all actions for specified categories
    public function deleteCategoryActions($categories)
    {
        if (is_null($categories)) {
            return false;
        }
        $categories = asArray($categories);

        if (!$this->checkCache()) {
            return false;
        }

        $itemsToDelete = [];
        foreach ($this->cache as $item_id => $item) {
            if (
                $item->action_id === IMPORT_ACTION_SET_CATEGORY
                && in_array($item->value, $categories)
            ) {
                $itemsToDelete[] = $item_id;
            }
        }

        return $this->del($itemsToDelete);
    }

    public static function getActions()
    {
        return convertToObjectArray(self::$actionNames);
    }


    public static function getActionNames()
    {
        return [
            IMPORT_ACTION_SET_TR_TYPE => __("ACTION_SET_TR_TYPE"),
            IMPORT_ACTION_SET_ACCOUNT => __("ACTION_SET_ACCOUNT"),
            IMPORT_ACTION_SET_PERSON => __("ACTION_SET_PERSON"),
            IMPORT_ACTION_SET_SRC_AMOUNT => __("ACTION_SET_SRC_AMOUNT"),
            IMPORT_ACTION_SET_DEST_AMOUNT => __("ACTION_SET_DEST_AMOUNT"),
            IMPORT_ACTION_SET_COMMENT => __("ACTION_SET_COMMENT"),
            IMPORT_ACTION_SET_CATEGORY => __("ACTION_SET_CATEGORY"),
        ];
    }

    public static function getActionName($action_id)
    {
        $actionNames = self::getActionNames();
        if (!isset($actionNames[$action_id])) {
            return null;
        }

        return $actionNames[$action_id];
    }
}
