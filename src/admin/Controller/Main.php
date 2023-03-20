<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;

/**
 * Main admin controller
 */
class Main extends AdminController
{
    /**
     * /admin/ route handler
     * Renders main admin view
     */
    public function index()
    {
        $this->template = new Template(ADMIN_VIEW_TPL_PATH . "Main.tpl");
        $data = [
            "titleString" => "Admin panel",
        ];

        $this->initResources("AdminMainView");
        $this->render($data);
    }
}
