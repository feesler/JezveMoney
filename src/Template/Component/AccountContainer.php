<?php

namespace JezveMoney\App\Template\Component;

use JezveMoney\Core\TemplateComponent;

class AccountContainer extends TemplateComponent
{
    protected static $template = null;
    protected static $filename = "AccountContainer.tpl";

    public static function render($data)
    {
        $data["id"] = e($data["id"]);
        $data["inputId"] = e($data["inputId"]);
        $data["inputValue"] = e($data["inputValue"]);
        $data["title"] = e($data["title"]);

        if (!isset($data["baseHidden"])) {
            $data["baseHidden"] = false;
        }
        if (!isset($data["closeButton"])) {
            $data["closeButton"] = null;
        }
        if (!isset($data["accountToggler"])) {
            $data["accountToggler"] = null;
        }
        if (!isset($data["noAccountsMsg"])) {
            $data["noAccountsMsg"] = null;
        }
        if (!isset($data["noAccountsMsgHidden"])) {
            $data["noAccountsMsgHidden"] = null;
        }

        return self::renderTemplate($data);
    }
}
