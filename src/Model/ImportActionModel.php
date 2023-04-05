<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\App\Item\ImportActionItem;

// Action types
// Consider not to change date
define("IMPORT_ACTION_SET_TR_TYPE", 1);
define("IMPORT_ACTION_SET_ACCOUNT", 2);
define("IMPORT_ACTION_SET_PERSON", 3);
define("IMPORT_ACTION_SET_SRC_AMOUNT", 4);
define("IMPORT_ACTION_SET_DEST_AMOUNT", 5);
define("IMPORT_ACTION_SET_COMMENT", 6);
define("IMPORT_ACTION_SET_CATEGORY", 7);

/**
 * Import rule action model
 */
class ImportActionModel extends CachedTable
{
    use Singleton;

    private static $user_id = 0;

    protected static $availActions = [
        IMPORT_ACTION_SET_TR_TYPE,
        IMPORT_ACTION_SET_ACCOUNT,
        IMPORT_ACTION_SET_PERSON,
        IMPORT_ACTION_SET_SRC_AMOUNT,
        IMPORT_ACTION_SET_DEST_AMOUNT,
        IMPORT_ACTION_SET_COMMENT,
        IMPORT_ACTION_SET_CATEGORY,
    ];

    protected $tbl_name = "import_act";
    protected $accModel = null;
    protected $personModel = null;
    protected $ruleModel = null;

    /**
     * Model initialization
     */
    protected function onStart()
    {
        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();

        $this->dbObj = MySqlDB::getInstance();
        $this->accModel = AccountModel::getInstance();
        $this->personModel = PersonModel::getInstance();
        $this->ruleModel = ImportRuleModel::getInstance();
    }

    /**
     * Converts table row from database to object
     *
     * @param array|null $row
     *
     * @return ImportActionItem|null
     */
    protected function rowToObj(?array $row)
    {
        return ImportActionItem::fromTableRow($row);
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

    /**
     * Validates action data before to send create/update request to database
     *
     * @param int $actionId action type
     * @param mixed $value item id
     */
    protected function validateAction(int $actionId, mixed $value)
    {
        $importTransactionTypes = [
            "expense",
            "income",
            "transfer_out",
            "transfer_in",
            "debt_out",
            "debt_in",
            "limit",
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
        if (!is_array($params) || !isset($params["rule_id"]) || !isset($params["action_id"])) {
            return false;
        }

        $items = $this->getData([
            "rule" => $params["rule_id"],
            "action" => $params["action_id"]
        ]);
        $foundItem = (is_array($items) && count($items) > 0) ? $items[0] : null;
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

        $this->validateAction($res["action_id"], $res["value"]);

        $res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");
        $res["user_id"] = self::$user_id;

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

        $targetAction = isset($res["action_id"]) ? $res["action_id"] : $item->action;
        $targetValue = isset($res["value"]) ? $res["value"] : $item->value;

        $this->validateAction($targetAction, $targetValue);

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

        return true;
    }

    /**
     * Returns array of import actions
     *
     * @param array $params array of options:
     *     - 'full' => (bool) - returns import actions of all users, admin only
     *     - 'rule' => (int) - select import actions by rule, default is 0
     *     - 'action' => (int) - select import actions by action type, default is 0
     *
     * @return ImportActionItem[]|null
     */
    public function getData(array $params = [])
    {
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

            $res[] = $item;
        }

        return $res;
    }

    /**
     * Returns array of import actions of specified import rule
     *
     * @param int $rule_id import rule id
     *
     * @return ImportActionItem[]|null
     */
    public function getRuleActions(int $rule_id)
    {
        return $this->getData(["rule" => $rule_id]);
    }

    /**
     * Sets new actions for specified import rule. Removes all previous actions of rule
     *
     * @param int $rule_id import rule id
     * @param array $actions array of import actions
     *
     * @return bool
     */
    public function setRuleActions(int $rule_id, array $actions)
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

    /**
     * Removes all actions of specified import rules
     *
     * @param int[]|int|null $rules id or array of import rule ids
     *
     * @return bool
     */
    public function deleteRuleActions(mixed $rules)
    {
        if (is_null($rules)) {
            return false;
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

    /**
     * Removes all actions with specified accounts
     *
     * @param int[]|int|null $accounts id or array of account ids
     *
     * @return bool
     */
    public function deleteAccountActions(mixed $accounts)
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

    /**
     * Removes all actions with specified persons
     *
     * @param int[]|int|null $persons id or array of person ids
     *
     * @return bool
     */
    public function deletePersonActions(mixed $persons)
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

    /**
     * Removes all actions with specified categories
     *
     * @param int[]|int|null $categories id or array of category ids
     *
     * @return bool
     */
    public function deleteCategoryActions(mixed $categories)
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

    /**
     * Returns array of names for available action types
     *
     * @return array
     */
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

    /**
     * Returns name of specified action type
     *
     * @param int $action_id action type
     *
     * @return string|null
     */
    public static function getActionName(int $action_id)
    {
        $actionNames = self::getActionNames();
        if (!isset($actionNames[$action_id])) {
            return null;
        }

        return $actionNames[$action_id];
    }
}
