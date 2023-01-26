<?php

namespace JezveMoney\App\Item;

class CategoryItem
{
    public $id = 0;
    public $user_id = 0;
    public $name = null;
    public $parent_id = 0;
    public $type = 0;
    public $pos = 0;
    public $createdate = 0;
    public $updatedate = 0;

    /**
     * Converts table row from database to CategoryItem object
     *
     * @param array|null $row
     *
     * @return CategoryItem|null
     */
    public static function fromTableRow(?array $row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new static();
        $res->id = intval($row["id"]);
        $res->user_id = intval($row["user_id"]);
        $res->parent_id = intval($row["parent_id"]);
        $res->name = $row["name"];
        $res->type = intval($row["type"]);
        $res->pos = intval($row["pos"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }
}
