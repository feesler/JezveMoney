<?php

namespace JezveMoney\App\Item;

class CurrencyItem
{
    public $id = 0;
    public $name = null;
    public $sign = null;
    public $flags = 0;
    public $createdate = 0;
    public $updatedate = 0;

    /**
     * Converts table row from database to CurrencyItem object
     *
     * @param array $row
     *
     * @return CurrencyItem|null
     */
    public static function fromTableRow(array $row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new static();
        $res->id = intval($row["id"]);
        $res->name = $row["name"];
        $res->sign = $row["sign"];
        $res->flags = intval($row["flags"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }
}
