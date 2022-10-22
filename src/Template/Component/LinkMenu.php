<?php

namespace JezveMoney\App\Template\Component;

use JezveMoney\Core\TemplateComponent;

class LinkMenu extends TemplateComponent
{
    protected static $template = null;
    protected static $filename = "LinkMenu.tpl";

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

        $classNames = ["link-menu"];
        if (isset($data["classNames"])) {
            array_push($classNames, ...asArray($data["classNames"]));
        }
        $attrs[] = "class=\"" . implode(" ", $classNames) . "\"";

        $data["attributes"] = implode(" ", $attrs);

        return self::renderTemplate($data);
    }
}
