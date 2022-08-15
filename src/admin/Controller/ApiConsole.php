<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\App\Model\ImportTemplateModel;
use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;

class ApiConsole extends AdminController
{
    public function index()
    {
        $this->template = new Template(ADMIN_TPL_PATH . "apiconsole.tpl");
        $data = [
            "titleString" => "Admin panel | API console",
        ];

        $tplModel = ImportTemplateModel::getInstance();
        $data["tplColumns"] = $tplModel->getColumnTypes();

        $this->cssAdmin[] = "ApiConsoleView.css";
        $this->jsAdmin[] = "ApiConsoleView.js";

        $this->render($data);
    }
}
