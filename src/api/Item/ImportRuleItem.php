<?php

namespace JezveMoney\App\Item;

class ImportRuleItem
{
    public $id = 0;
    public $flags = 0;
    public $user_id = 0;
    public $conditions = null;
    public $actions = null;

    public function __construct($obj, $userField = false)
    {
        if (is_null($obj)) {
            throw new \Error("Invalid object");
        }

        $this->id = $obj->id;
        $this->flags = $obj->flags;
        if ($userField) {
            $this->user_id = $obj->user_id;
        }
    }
}
