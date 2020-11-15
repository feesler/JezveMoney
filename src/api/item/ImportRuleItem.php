<?php

namespace JezveMoney\App\Item;

class ImportRuleItem
{
    public $id = 0;
    public $parent_id = 0;
    public $field_id = 0;
    public $operator = 0;
    public $value = null;
    public $flags = null;


    public function __construct($obj, $userField = false)
    {
        if (is_null($obj)) {
            throw new \Error("Invalid object");
        }

        $this->id = $obj->id;
        $this->parent_id = $obj->parent_id;
        $this->field_id = $obj->field_id;
        $this->operator = $obj->operator;
        $this->value = $obj->value;
        $this->flags = $obj->flags;
        if ($userField) {
            $this->user_id = $obj->user_id;
        }
    }
}
