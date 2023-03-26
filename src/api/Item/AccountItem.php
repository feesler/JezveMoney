<?php

namespace JezveMoney\App\Item;

class AccountItem
{
    public $id = 0;
    public $user_id = 0;
    public $owner_id = 0;
    public $type = 0;
    public $name = null;
    public $curr_id = 0;
    public $initbalance = 0;
    public $limit = 0;
    public $balance = 0;
    public $icon_id = 0;
    public $flags = 0;
    public $pos = 0;
    public $createdate = 0;
    public $updatedate = 0;

    /**
     * Converts table row from database to AccountItem object
     *
     * @param array|null $row
     *
     * @return AccountItem|null
     */
    public static function fromTableRow(?array $row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new static();
        $res->id = intval($row["id"]);
        $res->user_id = intval($row["user_id"]);
        $res->type = intval($row["type"]);
        $res->name = $row["name"];
        $res->owner_id = intval($row["owner_id"]);
        $res->curr_id = intval($row["curr_id"]);
        $res->balance = floatval($row["balance"]);
        $res->initbalance = floatval($row["initbalance"]);
        $res->limit = floatval($row["limit"]);
        $res->icon_id = intval($row["icon_id"]);
        $res->flags = intval($row["flags"]);
        $res->pos = intval($row["pos"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }
}
