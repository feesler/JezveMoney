<?php

namespace JezveMoney\App\Template\Component;

use JezveMoney\Core\TemplateComponent;

class Button extends TemplateComponent
{
    protected static $template = null;
    protected static $filename = "Button.tpl";

    public static function render($data)
    {
        $attrs = [];
        if (isset($data["attributes"])) {
            foreach ($data["attributes"] as $attribute => $value) {
                $attr = e($attribute);
                if (!is_empty($value)) {
                    $attr .= "=\"" . e($value) . "\"";
                }

                $attrs[] = $attr;
            }
        }
        if (isset($data["id"])) {
            $attrs[] = "id=\"" . e($data["id"]) . "\"";
        }
        if (isset($data["hidden"]) && $data["hidden"] == true) {
            $attrs[] = "hidden";
        }

        $classNames = ["btn"];
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
