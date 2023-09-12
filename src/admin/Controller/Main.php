<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Settings;
use JezveMoney\Core\Template;
use JezveMoney\Core\DBVersion;

/**
 * Main admin controller
 */
class Main extends AdminController
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
     * /admin/ route handler
     * Renders main admin view
     */
    public function index()
    {
        $this->template = new Template(ADMIN_VIEW_TPL_PATH . "Main.tpl");
        $data = [
            "titleString" => "Admin panel",
            "enableLogs" => Settings::getValue("enableLogs", false),
            "currentDBVersion" => $this->dbVer->getCurrentVersion(),
            "latestDBVersion" => $this->dbVer->getLatestVersion(),
        ];

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
        ];

        $this->initResources("AdminMainView");
        $this->render($data);
    }

    /**
     * /admin/update/ route handler
     * Runs database migrations
     */
    public function update()
    {
        if (!$this->isPOST()) {
            return;
        }

        $this->dbVer->autoUpdate();

        setLocation(BASEURL . "admin/");
    }
}
