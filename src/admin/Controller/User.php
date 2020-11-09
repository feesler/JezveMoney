<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;

class User extends AdminController
{
    public function index()
    {
        $uArr = $this->uMod->getData(["all" => true]);

        $this->menuItems["users"]["active"] = true;

        $titleString = "Admin panel | Users";

        $this->buildCSS();

        $this->jsArr[] = "view.js";
        array_push(
            $this->jsAdmin,
            "adminview.js",
            "adminlistview.js",
            "userview.js",
        );

        include(ADMIN_TPL_PATH . "user.tpl");
    }
}
