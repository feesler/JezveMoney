<?php

namespace JezveMoney\App\Item;

class ImportTemplateItem
{
    public $id = 0;
    public $name = null;
    public $type_id = 0;
    public $dateColumn = 0;
    public $commentColumn = 0;
    public $transactionCurrColumn = 0;
    public $transactionAmountColumn = 0;
    public $accountCurrColumn = 0;
    public $accountAmountColumn = 0;


    public function __construct($obj)
    {
        if (is_null($obj)) {
            throw new \Error("Invalid object");
        }

        $this->id = $obj->id;
        $this->name = $obj->name;
        $this->type_id = $obj->type_id;
        $this->dateColumn = $obj->dateColumn;
        $this->commentColumn = $obj->commentColumn;
        $this->transactionCurrColumn = $obj->transactionCurrColumn;
        $this->transactionAmountColumn = $obj->transactionAmountColumn;
        $this->accountCurrColumn = $obj->accountCurrColumn;
        $this->accountAmountColumn = $obj->accountAmountColumn;
    }
}
