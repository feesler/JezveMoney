<?php

namespace JezveMoney\App\Item;

class CategoryItem
{
    public $id = 0;
    public $name = null;
    public $parent_id = 0;
    public $type = 0;

    public function __construct($obj)
    {
        if (is_null($obj)) {
            throw new \Error("Invalid object");
        }

        $this->id = $obj->id;
        $this->parent_id = $obj->parent_id;
        $this->name = $obj->name;
        $this->type = $obj->type;
    }
}
