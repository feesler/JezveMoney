<?php

namespace JezveMoney\App\Item;

class ImportConditionItem
{
    public $id = 0;
    public $rule_id = 0;
    public $field_id = 0;
    public $operator = 0;
    public $value = null;
    public $flags = null;
    public $user_id = 0;
    public $createdate = 0;
    public $updatedate = 0;

    /** Currency field types */
    public static $itemFields = [
        IMPORT_COND_FIELD_MAIN_ACCOUNT,
        IMPORT_COND_FIELD_TPL,
        IMPORT_COND_FIELD_TR_CURRENCY,
        IMPORT_COND_FIELD_ACC_CURRENCY,
    ];

    /** Currency field types */
    public static $currencyFields = [
        IMPORT_COND_FIELD_TR_CURRENCY,
        IMPORT_COND_FIELD_ACC_CURRENCY,
    ];

    /** Amount field types */
    public static $amountFields = [
        IMPORT_COND_FIELD_TR_AMOUNT,
        IMPORT_COND_FIELD_ACC_AMOUNT,
    ];

    /** Item(account, template, currency) operators */
    public static $itemOperators = [
        IMPORT_COND_OP_EQUAL,
        IMPORT_COND_OP_NOT_EQUAL,
    ];

    /** Numeric(amount and date) operators */
    public static $numOperators = [
        IMPORT_COND_OP_EQUAL,
        IMPORT_COND_OP_NOT_EQUAL,
        IMPORT_COND_OP_LESS,
        IMPORT_COND_OP_GREATER,
    ];

    /** String operators */
    public static $stringOperators = [
        IMPORT_COND_OP_STRING_INCLUDES,
        IMPORT_COND_OP_STRING_NOT_INCLUDES,
        IMPORT_COND_OP_EQUAL,
        IMPORT_COND_OP_NOT_EQUAL,
        IMPORT_COND_OP_LESS,
        IMPORT_COND_OP_GREATER,
    ];

    /**
     * Converts table row from database to ImportConditionItem object
     *
     * @param array|null $row
     *
     * @return ImportConditionItem|null
     */
    public static function fromTableRow(?array $row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new static();
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

    /**
     * Converts table row from database to ImportConditionItem object
     *
     * @param array $request
     *
     * @return ImportConditionItem
     */
    public static function fromRequest(array $request)
    {
        self::validateRequest($request);

        $res = new static();

        if (isset($request["id"])) {
            $res->id = intval($request["id"]);
        }

        if (isset($request["rule_id"])) {
            $res->rule_id = intval($request["rule_id"]);
        }

        $res->field_id = intval($request["field_id"]);
        $res->operator = intval($request["operator"]);
        $res->value = $request["value"];
        $res->flags = intval($request["flags"]);

        return $res;
    }

    /**
     * Validates correctness of specified condition
     * Throws error in case of invalid data
     *
     * @param mixed $request
     */
    public static function validateRequest(mixed $request)
    {
        $avFields = [
            "field_id",
            "operator",
            "value",
            "flags",
        ];

        if (!is_array($request)) {
            throw new \Error("Invalid import rule condition");
        }

        checkFields($request, $avFields, true);
    }

    /**
     * Returns true if specified value is valid amount
     * @param mixed $value
     *
     * @return bool
     */
    public static function isValidAmount(mixed $value)
    {
        return is_numeric($value);
    }

    /**
     * Returns true if specified value is valid date string
     * @param mixed $value
     *
     * @return bool
     */
    public static function isValidDate(mixed $value)
    {
        return is_numeric($value) && intval($value) !== 0;
    }

    /**
     * Returns true if type of value for current field type is account, template or currency
     * @return bool
     */
    public function isItemField()
    {
        return in_array($this->field_id, static::$itemFields);
    }

    /**
     * Returns true if type of value for current field type is account
     * @return bool
     */
    public function isAccountField()
    {
        return $this->field_id === IMPORT_COND_FIELD_MAIN_ACCOUNT;
    }

    /**
     * Returns true if type of value for current field type is template
     * @return bool
     */
    public function isTemplateField()
    {
        return $this->field_id === IMPORT_COND_FIELD_TPL;
    }

    /**
     * Returns true if type of value for current field type is currency
     * @return bool
     */
    public function isCurrencyField()
    {
        return in_array($this->field_id, static::$currencyFields);
    }

    /**
     * Returns true if type of value for current field type is amount
     * @return bool
     */
    public function isAmountField()
    {
        return in_array($this->field_id, static::$amountFields);
    }

    /**
     * Returns true if type of value for current field type is date
     * @return bool
     */
    public function isDateField()
    {
        return $this->field_id === IMPORT_COND_FIELD_DATE;
    }

    /**
     * Returns true if type of value for current field type is string
     * @return bool
     */
    public function isStringField()
    {
        return $this->field_id === IMPORT_COND_FIELD_COMMENT;
    }

    /**
     * Returns true if current operator is available for items('equal' or 'not equal')
     * @return bool
     */
    public function isItemOperator()
    {
        return in_array($this->operator, static::$itemOperators);
    }

    /**
     * Returns true if current operator is available for numeric values
     * @return bool
     */
    public function isNumOperator()
    {
        return in_array($this->operator, static::$numOperators);
    }

    /**
     * Returns true if current operator is available for strings
     * @return bool
     */
    public function isStringOperator()
    {
        return in_array($this->operator, static::$stringOperators);
    }

    /**
     * Returns true if comparison with another property is enabled
     * @return bool
     */
    public function isPropertyValueFlag()
    {
        $mask = IMPORT_COND_OP_FIELD_FLAG;
        return (($this->flags & $mask) === $mask);
    }

    /**
     * Returns true if comparison with another property is available
     * @return bool
     */
    public function isPropertyValueAvailable()
    {
        return $this->isCurrencyField() || $this->isAmountField();
    }

    /**
     * Validates correctness of import rules condition and returns result
     * @return bool
     */
    public function validate()
    {
        // Check amount value
        if ($this->isAmountField()) {
            if (!static::isValidAmount($this->value)) {
                return false;
            }
        }

        // Check date condition
        if ($this->isDateField()) {
            if (!static::isValidDate($this->value)) {
                return false;
            }
        }

        // Check empty condition value is used only for string field
        // with 'equal' and 'not equal' operators
        if (
            $this->value === ""
            && (
                !$this->isStringField()
                || !$this->isItemOperator()
            )
        ) {
            return false;
        }

        if ($this->isPropertyValueFlag()) {
            // Check property value is available
            if (!$this->isPropertyValueAvailable()) {
                return false;
            }
            // Check property is not compared with itself as property value
            if ($this->field_id === intval($this->value)) {
                return false;
            }
        }

        return true;
    }
}
