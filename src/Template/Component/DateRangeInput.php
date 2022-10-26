<?php

namespace JezveMoney\App\Template\Component;

use JezveMoney\Core\TemplateComponent;

class DateRangeInput extends TemplateComponent
{
    protected static $template = null;
    protected static $filename = "DateRangeInput.tpl";

    protected static function formatDate($value)
    {
        $timeValue = strtotime($value);
        return ($timeValue === false) ? "" : date("d.m.Y", $timeValue);
    }

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

        $data["start"] = self::formatDate($data["start"]);
        $data["end"] = self::formatDate($data["end"]);
        $isFilter = !is_empty($data["start"]) && !is_empty($data["end"]);
        $data["hideClearButton"] = !$isFilter;

        return self::renderTemplate($data);
    }
}
