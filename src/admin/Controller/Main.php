<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;

class Main extends AdminController
{
    public function index()
    {
        $titleString = "Admin panel";

        $this->cssArr = ["lib/common.css", "app.css"];
        $this->cssAdmin = ["admin.css"];
        $this->buildCSS();

        include(ADMIN_TPL_PATH . "index.tpl");
    }
}
