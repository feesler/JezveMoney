<?php

class Currency
{
	public function __construct($obj)
	{
		$this->id = $obj->id;
		$this->name = $obj->name;
		$this->sign = $obj->sign;
		$this->flags = $obj->flags;
	}
}
