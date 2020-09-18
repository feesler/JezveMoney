<?php

namespace JezveMoney\App\Item;


class Currency
{
	public $id = 0;
	public $name = NULL;
	public $sign = NULL;
	public $flags = 0;


	public function __construct($obj)
	{
		if (is_null($obj))
			throw new \Error("Invalid object");

		$this->id = $obj->id;
		$this->name = $obj->name;
		$this->sign = $obj->sign;
		$this->flags = $obj->flags;
	}
}
