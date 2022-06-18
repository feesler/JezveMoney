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
        $data["attributes"] = implode(" ", $attrs);

        $classNames = ["iconlink"];
        if (isset($data["classNames"])) {
            array_push($classNames, ...asArray($data["classNames"]));
        }
        if (isset($data["hidden"]) && $data["hidden"] == true) {
            $classNames[] = "hidden";
        }
        $data["classNames"] = implode(" ", $classNames);

        if (!isset($data["type"])) {
            $data["type"] = "button";
        }

        if ($data["type"] == "link") {
            $data["linkAttributes"] = isset($data["link"])
                ? "href=\"" . e($data["link"]) . "\""
                : "";
        }

        return self::renderTemplate($data);
    }
}
