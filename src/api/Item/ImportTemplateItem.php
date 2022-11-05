<?php

namespace JezveMoney\App\Item;

class ImportTemplateItem
{
    public $id = 0;
    public $name = null;
    public $type_id = 0;
    public $account_id = 0;
    public $first_row = 0;
    public $columns = [];


    public function __construct($obj)
    {
        if (is_null($obj)) {
            throw new \Error("Invalid object");
        }

        $this->id = $obj->id;
        $this->name = $obj->name;
        $this->type_id = $obj->type_id;
        $this->account_id = $obj->account_id;
        $this->first_row = $obj->first_row;
        foreach ($obj->columns as $column => $ind) {
            $this->columns[$column] = $ind;
        }
    }
}
