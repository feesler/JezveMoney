<?php

namespace JezveMoney\App\Item;

class TransactionItem
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
    public $src_result = 0;
    public $dest_result = 0;
    public $date = 0;
    public $category_id = 0;
    public $comment = null;
    public $pos = 0;
    public $createdate = 0;
    public $updatedate = 0;


    /**
     * Converts table row from database to TransactionItem object
     *
     * @param array $row
     *
     * @return TransactionItem|null
     */
    public static function fromTableRow(array $row)
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
        $res->src_result = floatval($row["src_result"]);
        $res->dest_result = floatval($row["dest_result"]);
        $res->src_curr = intval($row["src_curr"]);
        $res->dest_curr = intval($row["dest_curr"]);
        $res->date = strtotime($row["date"]);
        $res->category_id = intval($row["category_id"]);
        $res->comment = $row["comment"];
        $res->pos = intval($row["pos"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }
}
