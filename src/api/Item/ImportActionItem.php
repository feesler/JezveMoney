<?php

namespace JezveMoney\App\Item;

class ImportActionItem
{
    /** List of action types requires select value from list */
    public static $selectActions = [
        IMPORT_ACTION_SET_TR_TYPE,
        IMPORT_ACTION_SET_ACCOUNT,
        IMPORT_ACTION_SET_PERSON,
        IMPORT_ACTION_SET_CATEGORY,
    ];

    /** List of action types requires amount value */
    public static $amountActions = [
        IMPORT_ACTION_SET_SRC_AMOUNT,
        IMPORT_ACTION_SET_DEST_AMOUNT,
    ];

    public $id = 0;
    public $rule_id = 0;
    public $action_id = 0;
    public $value = 0;
    public $user_id = 0;
    public $createdate = 0;
    public $updatedate = 0;

    /**
     * Converts table row from database to ImportActionItem object
     *
     * @param array|null $row
     *
     * @return ImportActionItem|null
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
        $res->action_id = intval($row["action_id"]);
        $res->value = $row["value"];
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }

    /**
     * Converts table row from database to ImportActionItem object
     *
     * @param array $request
     *
     * @return ImportActionItem
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

        $res->action_id = intval($request["action_id"]);
        $res->value = $request["value"];

        return $res;
    }

    /**
     * Validates correctness of specified condition
     * Throws error in case of invalid data
     *
     * @param mixed $request
     */
    private static function validateRequest(mixed $request)
    {
        $avFields = [
            "action_id",
            "value",
        ];

        if (!is_array($request)) {
            throw new \Error("Invalid import rule action");
        }

        checkFields($request, $avFields, true);
    }

    /**
     * Returns true if action requires to select value from list
     *
     * @return bool
     */
    public function isSelectValue()
    {
        return in_array($this->action_id, self::$selectActions);
    }

    /**
     * Returns true if action is 'Set source amount' or 'Set destination amount'
     *
     * @return bool
     */
    public function isAmountValue()
    {
        return in_array($this->action_id, self::$amountActions);
    }

    /**
     * Returns true if action is 'Set transaction type'
     *
     * @return bool
     */
    public function isTransactionTypeValue()
    {
        return $this->action_id === IMPORT_ACTION_SET_TR_TYPE;
    }

    /**
     * Returns true if action is 'Set account'
     *
     * @return bool
     */
    public function isAccountValue()
    {
        return $this->action_id === IMPORT_ACTION_SET_ACCOUNT;
    }

    /**
     * Returns true if action is 'Set person'
     *
     * @return bool
     */
    public function isPersonValue()
    {
        return $this->action_id === IMPORT_ACTION_SET_PERSON;
    }

    /**
     * Returns true if action is 'Set category'
     *
     * @return bool
     */
    public function isCategoryValue()
    {
        return $this->action_id === IMPORT_ACTION_SET_CATEGORY;
    }
}
