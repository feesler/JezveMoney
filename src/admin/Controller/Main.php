<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;

class Main extends AdminController
{
    public function index()
    {
        $titleString = "Admin panel";

        $this->buildCSS();

        include(ADMIN_TPL_PATH . "index.tpl");
    }
}
