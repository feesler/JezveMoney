<?php

namespace JezveMoney\App\Item;

class IntervalOffsetItem
{
    public $id = 0;
    public $user_id = 0;
    public $schedule_id = 0;
    public $month_offset = 0;
    public $day_offset = 0;

    /**
     * Converts table row from database to IntervalOffsetItem object
     *
     * @param array|null $row
     *
     * @return IntervalOffsetItem|null
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
        $res->month_offset = intval($row["month_offset"]);
        $res->day_offset = intval($row["day_offset"]);

        return $res;
    }
}
