<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\App\Model\ImportTemplateModel;
use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;

/**
 * API console controller
 */
class ApiConsole extends AdminController
{
    /**
     * /admin/apiconsole/ route handler
     * Renders API console view
     */
    public function index()
    {
        $this->template = new Template(ADMIN_VIEW_TPL_PATH . "ApiConsole.tpl");
        $data = [
            "titleString" => "Admin panel | API console",
        ];

        $tplModel = ImportTemplateModel::getInstance();
        $data["tplColumns"] = $tplModel->getColumnTypes();

        $this->initResources("ApiConsoleView");
        $this->render($data);
    }
}
