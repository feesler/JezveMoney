<?php

namespace JezveMoney\App\Item;


class Account
{
	public $id = 0;
	public $owner_id = 0;
	public $name = NULL;
	public $curr_id = 0;
	public $initbalance = 0;
	public $balance = 0;
	public $icon_id = 0;
	public $flags = 0;


	public function __construct($obj)
	{
		if (is_null($obj))
			throw new \Error("Invalid object");

		$this->id = $obj->id;
		$this->owner_id = $obj->owner_id;
		$this->name = $obj->name;
		$this->curr_id = $obj->curr_id;
		$this->initbalance = $obj->initbalance;
		$this->balance = $obj->balance;
		$this->icon_id = $obj->icon_id;
		$this->flags = $obj->flags;
	}
}
