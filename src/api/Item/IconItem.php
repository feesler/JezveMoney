<?php

namespace JezveMoney\App\Item;

class IconItem
{
    public $id = 0;
    public $name = null;
    public $file = null;
    public $type = 0;


    public function __construct($obj)
    {
        if (is_null($obj)) {
            throw new \Error("Invalid object");
        }

        $this->id = $obj->id;
        $this->name = $obj->name;
        $this->file = $obj->file;
        $this->type = $obj->type;
    }
}
