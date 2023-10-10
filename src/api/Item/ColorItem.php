<?php

namespace JezveMoney\App\Item;

class ColorItem
{
    public $id = 0;
    public $value = 0;
    public $type = 0;
    public $createdate = 0;
    public $updatedate = 0;

    /**
     * Converts table row from database to ColorItem object
     *
     * @param array|null $row
     *
     * @return ColorItem|null
     */
    public static function fromTableRow(?array $row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new static();
        $res->id = intval($row["id"]);
        $res->value = intToColor($row["value"]);
        $res->type = intval($row["type"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }
}
