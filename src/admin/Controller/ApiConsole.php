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
        $this->jsAdmin[] = "apiconsole.js";

        include(ADMIN_TPL_PATH . "apiconsole.tpl");
    }
}
