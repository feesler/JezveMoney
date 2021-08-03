<?php

namespace JezveMoney\App\Template;

use JezveMoney\Core\Template;

class Tile
{
    protected static $template = null;

    public static function render($data)
    {
        if (!self::$template) {
            self::$template = new Template(TPL_PATH . "Components/Tile.tpl");
        }

        $attrs = [];
        if (isset($data["attributes"])) {
            foreach ($data["attributes"] as $attribute => $value) {
                $attrs[] = e($attribute) . "=\"" . e($value) . "\"";
            }
        }
        if (isset($data["id"])) {
            $attrs[] = "id=\"" . e($data["id"]) . "\"";
        }
        $data["attributes"] = implode(" ", $attrs);

        if (!isset($data["type"])) {
            $data["type"] = "none";
        }

        return self::$template->render($data);
    }
}
