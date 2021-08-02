<?php

namespace JezveMoney\App\Template;

use JezveMoney\Core\Template;

class Paginator
{
    protected static $template = null;

    public static function render($data)
    {
        if (!self::$template) {
            self::$template = new Template(TPL_PATH . "Components/Paginator.tpl");
        }

        return self::$template->render($data);
    }
}
