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

        if (isset($data["attributes"])) {
            $attrs = [];
            foreach($data["attributes"] as $attribute => $value) {
                $attrs[] = e($attribute)."=\"".e($value)."\"";
            }
            $data["attributes"] = implode(" ", $attrs);
        } else {
            $data["attributes"] = "";
        }

        if (!isset($data["type"])) {
            $data["type"] = "none";
        }

        return self::$template->render($data);
    }
}
