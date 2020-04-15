<?php

class Transaction
{
	public function __construct($obj)
	{
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
		$this->comment = $obj->comment;
		$this->pos = $obj->pos;
	}
}
