<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;

class User extends AdminController
{
    public function index()
    {
        $uArr = $this->uMod->getData([ "all" => true ]);

        $this->menuItems["users"]["active"] = true;

        $titleString = "Admin panel | Users";

        $this->cssAdmin[] = "currency.css";
        $this->buildCSS();
        $this->jsArr[] = "currency.js";
        $this->jsAdmin[] = "user.js";

        include(ADMIN_TPL_PATH . "user.tpl");
    }
}
