<?php

namespace JezveMoney\App\Item;

class ImportRuleItem
{
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
     * @param array $row
     *
     * @return ImportRuleItem|null
     */
    public static function fromTableRow(array $row)
    {
        if (is_null($row)) {
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
}
