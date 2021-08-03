<?php

namespace JezveMoney\Core;

use JezveMoney\Core\Template;

abstract class TemplateComponent
{
    protected static $filename = null;

    public static function render($data)
    {
        return self::renderTemplate($data);
    }

    protected static function renderTemplate($data)
    {
        if (!static::$template) {
            static::$template = new Template(TPL_PATH . "Components/" . static::$filename);
        }

        return static::$template->render($data);
    }
}
