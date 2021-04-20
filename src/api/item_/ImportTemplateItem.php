<?php

namespace JezveMoney\App\Item;

class ImportTemplateItem
{
    public $id = 0;
    public $name = null;
    public $type_id = 0;
    public $columns = [];


    public function __construct($obj)
    {
        if (is_null($obj)) {
            throw new \Error("Invalid object");
        }

        $this->id = $obj->id;
        $this->name = $obj->name;
        $this->type_id = $obj->type_id;
        foreach ($obj->columns as $column => $ind) {
            $this->columns[$column] = $ind;
        }
    }
}
