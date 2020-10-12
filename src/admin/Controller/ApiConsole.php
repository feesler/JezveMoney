<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;

class ApiConsole extends AdminController
{
    public function index()
    {
        $this->menuItems["apiconsole"]["active"] = true;

        $titleString = "Admin panel | API console";

        $this->cssAdmin[] = "apiconsole.css";
        $this->buildCSS();

        $this->jsArr[] = "view.js";
        array_push($this->jsAdmin,
            "adminview.js",
            "apiconsoleview.js"
        );

        include(ADMIN_TPL_PATH . "apiconsole.tpl");
    }
}
