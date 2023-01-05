<?php

namespace JezveMoney\App\Item;

class ImportConditionItem
{
    public $id = 0;
    public $rule_id = 0;
    public $field_id = 0;
    public $operator = 0;
    public $value = null;
    public $flags = null;
    public $user_id = 0;


    public function __construct($obj, $userField = false)
    {
        if (is_null($obj)) {
            throw new \Error("Invalid object");
        }

        $this->id = $obj->id;
        $this->rule_id = $obj->rule_id;
        $this->field_id = $obj->field_id;
        $this->operator = $obj->operator;
        $this->value = $obj->value;
        $this->flags = $obj->flags;
        if ($userField) {
            $this->user_id = $obj->user_id;
        }
    }
}
