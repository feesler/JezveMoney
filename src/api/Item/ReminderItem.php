<?php

namespace JezveMoney\App\Item;

class ReminderItem
{
    public $id = 0;
    public $user_id = 0;
    public $schedule_id = 0;
    public $state = 0;
    public $date = 0;
    public $transaction_id = 0;
    public $createdate = 0;
    public $updatedate = 0;

    /**
     * Converts table row from database to ReminderItem object
     *
     * @param array|null $row
     *
     * @return ReminderItem|null
     */
    public static function fromTableRow(?array $row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new static();
        $res->id = intval($row["id"]);
        $res->user_id = intval($row["user_id"]);
        $res->schedule_id = intval($row["schedule_id"]);
        $res->state = intval($row["state"]);
        $res->date = strtotime($row["date"]);
        $res->transaction_id = intval($row["transaction_id"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }
}
