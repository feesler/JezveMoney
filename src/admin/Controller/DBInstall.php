<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;
use JezveMoney\Core\DBVersion;

class DBInstall extends AdminController
{
    protected $dbVer = null;


    protected function onStart()
    {
        $this->dbVer = DBVersion::getInstance();
    }


    public function index()
    {
        $this->template = new Template(ADMIN_TPL_PATH . "dbinstall.tpl");
        $data = [
            "titleString" => "Admin panel | DB update",
            "currentDBVersion" => $this->dbVer->getCurrentVersion(),
            "latestDBVersion" => $this->dbVer->getLatestVersion(),
        ];

        $this->cssAdmin[] = "DBInstallView.css";
        $this->jsAdmin[] = "DBInstallView.js";

        $this->render($data);
    }


    public function update()
    {
        if (!$this->isPOST()) {
            return;
        }

        $this->dbVer->autoUpdate();

        setLocation(BASEURL . "admin/dbinstall");
    }
}
