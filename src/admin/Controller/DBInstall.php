<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
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
        $currentDBVersion = $this->dbVer->getCurrentVersion();
        $latestDBVersion = $this->dbVer->getLatestVersion();

        $this->menuItems["dbinstall"]["active"] = true;

        $titleString = "Admin panel | DB update";

        $this->buildCSS();

        include(ADMIN_TPL_PATH . "dbinstall.tpl");
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
