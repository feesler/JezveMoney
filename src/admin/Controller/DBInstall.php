<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;
use JezveMoney\Core\DBVersion;

/**
 * Database migration controller
 */
class DBInstall extends AdminController
{
    protected $dbVer = null;

    /**
     * Controller initialization
     */
    protected function onStart()
    {
        $this->dbVer = DBVersion::getInstance();
    }

    /**
     * /admin/dbinstall/ route handler
     * Renders DB install view
     */
    public function index()
    {
        $this->template = new Template(ADMIN_VIEW_TPL_PATH . "DBInstall.tpl");
        $data = [
            "titleString" => "Admin panel | DB update",
            "currentDBVersion" => $this->dbVer->getCurrentVersion(),
            "latestDBVersion" => $this->dbVer->getLatestVersion(),
        ];

        $this->cssAdmin[] = "DBInstallView.css";
        $this->jsAdmin[] = "DBInstallView.js";

        $this->render($data);
    }

    /**
     * /admin/dbinstall/update/ route handler
     * Runs database migrations
     */
    public function update()
    {
        if (!$this->isPOST()) {
            return;
        }

        $this->dbVer->autoUpdate();

        setLocation(BASEURL . "admin/dbinstall");
    }
}
