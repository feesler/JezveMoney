<?php

namespace JezveMoney\App\Item;

use JezveMoney\App\Model\ImportActionModel;
use JezveMoney\App\Model\ImportConditionModel;
use JezveMoney\App\Model\UserModel;

class ImportRuleItem
{
    public static array $defaultValues = [
        "flags" => 0,
    ];

    public $id = 0;
    public $flags = 0;
    public $user_id = 0;
    public $createdate = 0;
    public $updatedate = 0;
    public $conditions = null;
    public $actions = null;

    /**
     * Converts table row from database to ImportRuleItem object
     *
     * @param array|null $row
     *
     * @return ImportRuleItem|null
     */
    public static function fromTableRow(?array $row)
    {
        if (!is_array($row)) {
            return null;
        }

        $res = new static();
        $res->id = intval($row["id"]);
        $res->user_id = intval($row["user_id"]);
        $res->flags = intval($row["flags"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }

    /**
     * @param array $request
     *
     * @return ImportRuleItem|null
     */
    public static function fromRequest(array $request)
    {
        $request = array_merge(static::$defaultValues, $request);

        $res = new static();
        if (isset($request["id"])) {
            $res->id = intval($request["id"]);
        }

        $res->flags = intval($request["flags"]);

        if (isset($request["conditions"])) {
            $res->conditions = [];
            foreach ((array)$request["conditions"] as $item) {
                $res->conditions[] = ImportConditionItem::fromRequest($item);
            }
        }

        if (isset($request["actions"])) {
            $res->actions = [];
            foreach ((array)$request["actions"] as $item) {
                $res->actions[] = ImportActionItem::fromRequest($item);
            }
        }

        return $res;
    }

    /**
     * Returns import rules object for client
     *
     * @param mixed $item
     * @param array $params array of options:
     *     - 'extended' => (bool) - return extenden rule object, default is false
     *
     * @return \stdClass
     */
    public static function getUserData(mixed $item, array $params = [])
    {
        if (!is_array($item) && !is_object($item)) {
            throw new \Error("Invalid item");
        }

        $item = (object)$item;

        $requestAll = (isset($params["full"]) && $params["full"] == true && UserModel::isAdminUser());
        $addExtended = isset($params["extended"]) && $params["extended"] == true;

        $res = new \stdClass();
        $res->id = $item->id;
        $res->flags = $item->flags;
        $res->createdate = $item->createdate;
        $res->updatedate = $item->updatedate;

        if ($requestAll) {
            $res->user_id = $item->user_id;
        }

        if ($addExtended) {
            $condModel = ImportConditionModel::getInstance();
            $res->conditions = $condModel->getRuleConditions($res->id);

            $actionModel = ImportActionModel::getInstance();
            $res->actions = $actionModel->getRuleActions($res->id);
        }

        return $res;
    }

    /**
     * Verifies import rule and returns result
     *
     * @return bool
     */
    public function validate()
    {
        // Check conditions
        $notEqConds = [];
        $lessConds = [];
        $greaterConds = [];

        if (
            !isset($this->conditions)
            || !is_array($this->conditions)
            || !count($this->conditions)
        ) {
            return false;
        }

        foreach ($this->conditions as $condition) {
            if (!($condition instanceof ImportConditionItem)) {
                return false;
            }

            if (!$condition->validate()) {
                return false;
            }

            // Check full duplicates of condition
            if ($this->hasSameCondition($condition, $this->conditions)) {
                return false;
            }

            // Check conflicts for 'not includes' string operator
            if ($this->hasConflictForNotIncludes($condition, $this->conditions)) {
                return false;
            }

            // Check 'equal' conditions for each field type present only once
            // 'Equal' operator is exclusive: conjunction with any other operator gives
            // the same result, so it is meaningless
            if ($condition->operator === IMPORT_COND_OP_EQUAL) {
                if ($this->hasSameFieldCondition($condition, $this->conditions)) {
                    return false;
                }
            }

            if ($condition->operator === IMPORT_COND_OP_LESS) {
                // Check 'less' condition for each field type present only once
                if ($this->hasSameFieldCondition($condition, $lessConds)) {
                    return false;
                }
                // Check value regions of 'greater' and 'not equal' conditions is intersected
                // with value region of current condition
                if (
                    $this->hasNotLessCondition($condition, $greaterConds)
                    || $this->hasNotLessCondition($condition, $notEqConds)
                ) {
                    return false;
                }


                $lessConds[] = $condition;
            }

            if ($condition->operator === IMPORT_COND_OP_GREATER) {
                // Check 'greater' condition for each field type present only once
                if ($this->hasSameFieldCondition($condition, $greaterConds)) {
                    return false;
                }
                // Check value regions of 'less' and 'not equal' conditions is intersected
                // with value region of current condition
                if (
                    $this->hasNotGreaterCondition($condition, $lessConds)
                    || $this->hasNotGreaterCondition($condition, $notEqConds)
                ) {
                    return false;
                }


                $greaterConds[] = $condition;
            }

            if ($condition->operator === IMPORT_COND_OP_NOT_EQUAL) {
                // Check value regions of 'less' and 'greater' conditions es intersected
                // with current value
                if (
                    $this->hasNotGreaterCondition($condition, $lessConds)
                    || $this->hasNotLessCondition($condition, $greaterConds)
                ) {
                    return false;
                }

                $notEqConds[] = $condition;
            }
        }

        // Check actions
        $ruleActionTypes = [];

        if (
            !isset($this->actions)
            || !is_array($this->actions)
            || !count($this->actions)
        ) {
            return false;
        }

        foreach ($this->actions as $action) {
            if (!($action instanceof ImportActionItem)) {
                return false;
            }

            // Check each type of action is used only once
            if (in_array($action->action_id, $ruleActionTypes)) {
                return false;
            }

            $ruleActionTypes[] = $action->action_id;

            // Amount value
            if ($action->isAmountValue() && !$this->isValidActionAmount($action->value)) {
                return false;
            }

            // Account value
            if ($action->isAccountValue() && !$this->hasSetTransfer($this->actions)) {
                return false;
            }

            // Check main account guard condition for 'Set account' action
            if ($action->isAccountValue()) {
                $accountId = intval($action->value);
                if (!$this->hasAccountGuardCondition($accountId, $this->conditions)) {
                    return false;
                }
            }

            // Person value
            if ($action->isPersonValue() && !$this->hasSetDebt($this->actions)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Validate action amount value
     *
     * @param mixed $value
     *
     * @return bool
     */
    public function isValidActionAmount(mixed $value)
    {
        return is_numeric($value) && floatval($value) > 0;
    }

    /**
     * Check list of conditions has condition with same properties
     *
     * @param ImportConditionItem $condition
     * @param array $conditionsList
     *
     * @return bool
     */
    public function hasSameCondition(ImportConditionItem $condition, array $conditionsList)
    {
        foreach ($conditionsList as $item) {
            if (
                $item !== $condition
                && $item->field_id === $condition->field_id
                && $item->operator === $condition->operator
                && $item->value === $condition->value
                && $item->flags === $condition->flags
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check list of conditions has condition with same field type
     *
     * @param ImportConditionItem $condition
     * @param array $conditionsList
     *
     * @return bool
     */
    public function hasSameFieldCondition(ImportConditionItem $condition, array $conditionsList)
    {
        foreach ($conditionsList as $item) {
            if (
                $item !== $condition
                && $item->flags === $condition->flags
                && $item->field_id === $condition->field_id
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check list of conditions has condition with same field type
     * and equal or greater value than specified condition
     *
     * @param ImportConditionItem $condition
     * @param array $conditionsList
     *
     * @return bool
     */
    public function hasNotLessCondition(ImportConditionItem $condition, array $conditionsList)
    {
        if ($condition->isPropertyValueFlag()) {
            return false;
        }

        $value = $condition->value;
        foreach ($conditionsList as $item) {
            if (
                $item !== $condition
                && !$item->isPropertyValueFlag()
                && $item->field_id === $condition->field_id
                && !($item->value < $value)
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check list of conditions has condition with same field type
     * and equal or less value than specified condition
     *
     * @param ImportConditionItem $condition
     * @param array $conditionsList
     *
     * @return bool
     */
    public function hasNotGreaterCondition(ImportConditionItem $condition, array $conditionsList)
    {
        if ($condition->isPropertyValueFlag()) {
            return false;
        }

        $value = $condition->value;
        foreach ($conditionsList as $item) {
            if (
                $item !== $condition
                && !$item->isPropertyValueFlag()
                && $item->field_id === $condition->field_id
                && !($item->value > $value)
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Returns true if list of conditions has condition conflicting with
     *  specified condition with 'not includes' operator:
     *  conditions with 'includes' or 'equal' operators and crossinig value
     * @param ImportConditionItem $condition
     * @param ImportConditionItem[] $conditionsList
     *
     * @return bool
     */
    public function hasConflictForNotIncludes(ImportConditionItem $condition, array $conditionsList)
    {
        if (!is_array($conditionsList)) {
            throw new \Error("Invalid parameters");
        }

        if ($condition->operator !== IMPORT_COND_OP_STRING_NOT_INCLUDES) {
            return false;
        }

        $conflictingOperators = [IMPORT_COND_OP_EQUAL, IMPORT_COND_OP_STRING_INCLUDES];

        foreach ($conditionsList as $item) {
            $item->validate();

            if (
                $item !== $condition
                && $item->field_id === $condition->field_id
                && !$item->isPropertyValueFlag()
                && in_array($item->operator, $conflictingOperators)
                && str_contains($item->value, $condition->value)
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param int $accountId
     * @param array $conditionsList
     *
     * @return bool
     */
    public function hasAccountGuardCondition(int $accountId, array $conditionsList)
    {
        if (!$accountId) {
            throw new \Error("Invalid account id");
        }

        foreach ($conditionsList as $condition) {
            if (!$condition->isAccountField()) {
                continue;
            }

            $conditionAccount = intval($condition->value);
            if (
                (
                    $condition->operator === IMPORT_COND_OP_NOT_EQUAL
                    && $conditionAccount === $accountId
                ) || (
                    $condition->operator === IMPORT_COND_OP_EQUAL
                    && $conditionAccount !== $accountId
                )
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check list has `Set transaction type` action with 'transfer_out' or 'transfer_in' value
     *
     * @param mixed $actions
     *
     * @return bool
     */
    public function hasSetTransfer($actions)
    {
        $res = array_filter($actions, fn ($item) => (
            $item->action_id === IMPORT_ACTION_SET_TR_TYPE
            && (
                $item->value === "transfer_out"
                || $item->value === "transfer_in"
            )
        ));

        return count($res) > 0;
    }

    /**
     * Check list has `Set transaction type` action with 'debt_out' or 'debt_in' value
     *
     * @param mixed $actions
     *
     * @return bool
     */
    public function hasSetDebt($actions)
    {
        $res = array_filter($actions, fn ($item) => (
            $item->action_id === IMPORT_ACTION_SET_TR_TYPE
            && (
                $item->value === "debt_out"
                || $item->value === "debt_in"
            )
        ));

        return count($res) > 0;
    }
}
