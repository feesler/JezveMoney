<?php

namespace JezveMoney\App\Item;

class IconItem
{
    public $id = 0;
    public $name = null;
    public $file = null;
    public $type = 0;
    public $createdate = 0;
    public $updatedate = 0;

    /**
     * Converts table row from database to IconItem object
     *
     * @param array $row
     *
     * @return IconItem|null
     */
    public static function fromTableRow(array $row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new static();
        $res->id = intval($row["id"]);
        $res->name = $row["name"];
        $res->file = $row["file"];
        $res->type = intval($row["type"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }
}
