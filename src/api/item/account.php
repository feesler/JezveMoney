<?php

class Account
{
	public function __construct($obj)
	{
		$this->id = $obj->id;
		$this->owner_id = $obj->owner_id;
		$this->name = $obj->name;
		$this->curr_id = $obj->curr_id;
		$this->initbalance = $obj->initbalance;
		$this->balance = $obj->balance;
		$this->icon = $obj->icon;
		$this->flags = $obj->flags;
	}
}
