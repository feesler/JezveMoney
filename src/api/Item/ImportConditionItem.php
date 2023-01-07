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

    /**
     * Converts table row from database to ImportConditionItem object
     *
     * @param array $row
     *
     * @return ImportConditionItem|null
     */
    public static function fromTableRow(array $row)
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
}
