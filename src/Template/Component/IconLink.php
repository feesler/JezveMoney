<?php

namespace JezveMoney\App\Template\Component;

use JezveMoney\Core\TemplateComponent;

class IconLink extends TemplateComponent
{
    protected static $template = null;
    protected static $filename = "IconLink.tpl";

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
        if (isset($data["hidden"]) && $data["hidden"] == true) {
            $attrs[] = "hidden";
        }

        $classNames = ["iconlink"];
        if (isset($data["classNames"])) {
            array_push($classNames, ...asArray($data["classNames"]));
        }
        $attrs[] = "class=\"" . implode(" ", $classNames) . "\"";

        if (!isset($data["type"])) {
            $data["type"] = "button";
        }

        if ($data["type"] == "button") {
            $attrs[] = "type=\"button\"";
        }

        if ($data["type"] == "link" && isset($data["link"])) {
            $attrs[] = "href=\"" . e($data["link"]) . "\"";
        }

        $data["attributes"] = implode(" ", $attrs);

        return self::renderTemplate($data);
    }
}
