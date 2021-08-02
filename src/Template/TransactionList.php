<?php

namespace JezveMoney\App\Template;

use JezveMoney\Core\Template;

class TransactionList
{
    protected static $template = null;

    public static function render($data)
    {
        if (!self::$template) {
            self::$template = new Template(TPL_PATH . "Components/TransactionList.tpl");
        }

        return self::$template->render($data);
    }
}
