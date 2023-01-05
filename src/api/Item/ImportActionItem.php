<?php

namespace JezveMoney\App\Item;

class ImportActionItem
{
    public $id = 0;
    public $rule_id = 0;
    public $action_id = 0;
    public $value = 0;
    public $user_id = 0;


    public function __construct($obj, $userField = false)
    {
        if (is_null($obj)) {
            throw new \Error("Invalid object");
        }

        $this->id = $obj->id;
        $this->rule_id = $obj->rule_id;
        $this->action_id = $obj->action_id;
        $this->value = $obj->value;
        if ($userField) {
            $this->user_id = $obj->user_id;
        }
    }
}
