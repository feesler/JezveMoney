<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Logger;

class Logs extends AdminController
{
    public function index()
    {
        $contents = Logger::read();

        $this->menuItems["log"]["active"] = true;

        $titleString = "Admin panel | Log";

        $this->cssArr = ["lib/common.css", "app.css"];
        $this->cssAdmin = ["admin.css"];
        $this->buildCSS();

        include(ADMIN_TPL_PATH . "log.tpl");
    }


    public function clean()
    {
        if (isset($_POST["clean"]) && $_POST["clean"] == "1") {
            Logger::clean();
        }

        setLocation(BASEURL . "admin/log/");
    }
}
