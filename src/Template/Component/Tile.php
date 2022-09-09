<?php

namespace JezveMoney\App\Template\Component;

use JezveMoney\Core\TemplateComponent;

const SUBTITLE_LIMIT = 13;

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

        $classNames = ["tile"];
        if (isset($data["classNames"])) {
            array_push($classNames, ...asArray($data["classNames"]));
        }

        if (isset($data["subtitle"])) {
            $subtitleLines = is_array($data["subtitle"]) ? $data["subtitle"] : [$data["subtitle"]];
            $subtitleLength = 0;
            $escapedLines = [];
            foreach ($subtitleLines as $line) {
                $subtitleLength = max($subtitleLength, mb_strlen($line));
                $escapedLines[] = e($line);
            }
            $data["subtitle"] = implode("<br>", $escapedLines);

            if ($subtitleLength > SUBTITLE_LIMIT) {
                $classNames[] = "tile--wide";
            }
        }

        $attrs[] = "class=\"" . implode(" ", $classNames) . "\"";

        if (!isset($data["type"])) {
            $data["type"] = "none";
        }

        if ($data["type"] == "link") {
            $data["tag"] = "a";
            $attrs[] = "href=\"" . e($data["link"]) . "\"";
        } elseif ($data["type"] == "button") {
            $data["tag"] = "button";
            $attrs[] = "type=\"button\"";
        } else {
            $data["tag"] = "div";
        }

        $data["attributes"] = implode(" ", $attrs);

        return self::renderTemplate($data);
    }
}
