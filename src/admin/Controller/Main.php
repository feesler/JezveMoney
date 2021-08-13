<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;

class Main extends AdminController
{
    public function index()
    {
        $this->template = new Template(ADMIN_TPL_PATH . "index.tpl");
        $data = [
            "titleString" => "Admin panel",
        ];

        $this->cssAdmin[] = "AdminMainView.css";

        $this->render($data);
    }
}
