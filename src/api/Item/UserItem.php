<?php

namespace JezveMoney\App\Item;

class UserItem
{
    public $id = 0;
    public $login = null;
    public $passhash = 0;
    public $owner_id = 0;
    public $access = null;
    public $reminders_date = null;
    public $createdate = 0;
    public $updatedate = 0;

    /**
     * Converts table row from database to UserItem object
     *
     * @param array|null $row
     *
     * @return UserItem|null
     */
    public static function fromTableRow(?array $row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new static();
        $res->id = intval($row["id"]);
        $res->login = $row["login"];
        $res->passhash = $row["passhash"];
        $res->owner_id = intval($row["owner_id"]);
        $res->access = intval($row["access"]);
        $res->reminders_date = ($row["reminders_date"]) ? strtotime($row["reminders_date"]) : null;
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }
}
