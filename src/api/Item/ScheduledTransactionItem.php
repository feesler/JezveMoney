<?php

namespace JezveMoney\App\Item;

class ScheduledTransactionItem
{
    public $id = 0;
    public $user_id = 0;
    public $type = 0;
    public $src_id = 0;
    public $dest_id = 0;
    public $src_amount = 0;
    public $dest_amount = 0;
    public $src_curr = 0;
    public $dest_curr = 0;
    public $category_id = 0;
    public $comment = null;
    public $start_date = 0;
    public $end_date = null;
    public $interval_type = 0;
    public $interval_step = 0;
    public $interval_offset = 0;
    public $createdate = 0;
    public $updatedate = 0;

    /**
     * Converts table row from database to ScheduledTransactionItem object
     *
     * @param array|null $row
     *
     * @return ScheduledTransactionItem|null
     */
    public static function fromTableRow(?array $row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new static();
        $res->id = intval($row["id"]);
        $res->user_id = intval($row["user_id"]);
        $res->src_id = intval($row["src_id"]);
        $res->dest_id = intval($row["dest_id"]);
        $res->type = intval($row["type"]);
        $res->src_amount = floatval($row["src_amount"]);
        $res->dest_amount = floatval($row["dest_amount"]);
        $res->src_curr = intval($row["src_curr"]);
        $res->dest_curr = intval($row["dest_curr"]);
        $res->category_id = intval($row["category_id"]);
        $res->comment = $row["comment"];
        $res->start_date = strtotime($row["start_date"]);
        $res->end_date = ($row["end_date"]) ? strtotime($row["end_date"]) : null;
        $res->interval_type = intval($row["interval_type"]);
        $res->interval_step = intval($row["interval_step"]);
        $res->interval_offset = intval($row["interval_offset"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }
}
