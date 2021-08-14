<?php

namespace JezveMoney\App\Template;

use JezveMoney\Core\TemplateComponent;

class Tile extends TemplateComponent
{
    protected static $template = null;
    protected static $filename = "Tile.tpl";

    public static function render($data)
    {
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

        return self::renderTemplate($data);
    }
}
