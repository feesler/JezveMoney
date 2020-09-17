<?php

class Icon
{
	public $id = 0;
	public $name = NULL;
	public $file = NULL;
	public $type = 0;


	public function __construct($obj)
	{
		if (is_null($obj))
			throw new Error("Invalid object");

		$this->id = $obj->id;
		$this->name = $obj->name;
		$this->file = $obj->file;
		$this->type = $obj->type;
	}
}
