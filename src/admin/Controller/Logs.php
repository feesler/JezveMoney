<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Logger;

/**
 * Logs controller
 */
class Logs extends AdminController
{
    /**
     * /admin/log/ route handler
     * Renders logs view
     */
    public function index()
    {
        $this->template = new Template(ADMIN_VIEW_TPL_PATH . "Log.tpl");
        $data = [
            "titleString" => "Admin panel | Log",
            "contents" => Logger::read(),
        ];

        $this->initResources("AdminLogsView");
        $this->render($data);
    }

    /**
     * /admin/log/clean/ route handler
     * Removes logs and reload logs view
     */
    public function clean()
    {
        if (isset($_POST["clean"]) && $_POST["clean"] == "1") {
            Logger::clean();
        }

        setLocation(BASEURL . "admin/log/");
    }
}
