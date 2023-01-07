<?php

namespace JezveMoney\App\Item;

class ImportActionItem
{
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
     * @param array $row
     *
     * @return ImportActionItem|null
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
        $res->action_id = intval($row["action_id"]);
        $res->value = $row["value"];
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }
}
