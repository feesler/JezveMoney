<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\App\Model\ImportTemplateModel;
use JezveMoney\Core\AdminController;

class ApiConsole extends AdminController
{
    public function index()
    {
        $tplModel = ImportTemplateModel::getInstance();
        $tplColumns = $tplModel->getColumnTypes();

        $this->menuItems["apiconsole"]["active"] = true;

        $titleString = "Admin panel | API console";

        $this->cssAdmin[] = "ApiConsoleView.css";
        $this->buildCSS();
        $this->jsAdmin[] = "ApiConsoleView.js";

        include(ADMIN_TPL_PATH . "apiconsole.tpl");
    }
}
