<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Logger;

class Logs extends AdminController
{
    public function index()
    {
        $this->template = new Template(ADMIN_TPL_PATH . "log.tpl");
        $data = [
            "titleString" => "Admin panel | Log",
            "contents" => Logger::read(),
        ];

        $this->menuItems["log"]["active"] = true;
        $this->cssAdmin[] = "AdminLogsView.css";

        $this->render($data);
    }


    public function clean()
    {
        if (isset($_POST["clean"]) && $_POST["clean"] == "1") {
            Logger::clean();
        }

        setLocation(BASEURL . "admin/log/");
    }
}
