<?php

namespace JezveMoney\App\Item;

class UserCurrrencyItem
{
    public $id = 0;
    public $user_id = 0;
    public $curr_id = 0;
    public $flags = 0;
    public $pos = 0;
    public $createdate = 0;
    public $updatedate = 0;

    /**
     * Converts table row from database to UserCurrrencyItem object
     *
     * @param array|null $row
     *
     * @return UserCurrrencyItem|null
     */
    public static function fromTableRow(?array $row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new static();
        $res->id = intval($row["id"]);
        $res->user_id = intval($row["user_id"]);
        $res->curr_id = intval($row["curr_id"]);
        $res->flags = intval($row["flags"]);
        $res->pos = intval($row["pos"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }
}
