<?php

namespace JezveMoney\App\Template\Component;

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

        if (isset($data["subtitle"])) {
            if (is_array($data["subtitle"])) {
                $data["subtitle"] = implode("<br>", array_map("e", $data["subtitle"]));
            } else {
                $data["subtitle"] = e($data["subtitle"]);
            }
        }

        return self::renderTemplate($data);
    }
}
