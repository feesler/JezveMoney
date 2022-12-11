<?php

namespace JezveMoney\App\Item;

class TransactionItem
{
    public $id = 0;
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


    public function __construct($obj)
    {
        if (is_null($obj)) {
            throw new \Error("Invalid object");
        }

        $this->id = $obj->id;
        $this->type = $obj->type;
        $this->src_id = $obj->src_id;
        $this->dest_id = $obj->dest_id;
        $this->src_amount = $obj->src_amount;
        $this->dest_amount = $obj->dest_amount;
        $this->src_curr = $obj->src_curr;
        $this->dest_curr = $obj->dest_curr;
        $this->src_result = $obj->src_result;
        $this->dest_result = $obj->dest_result;
        $this->date = date("d.m.Y", $obj->date);
        $this->category_id = $obj->category_id;
        $this->comment = $obj->comment;
        $this->pos = $obj->pos;
    }
}
