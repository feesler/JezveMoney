<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\DBVersion;


class DBInstall extends AdminController
{
	protected $dbVer = NULL;


	protected function onStart()
	{
		$this->dbVer = DBVersion::getInstance();
	}


	public function index()
	{
		$currentDBVersion = $this->dbVer->getCurrentVersion();
		$latestDBVersion = $this->dbVer->getLatestVersion();

		$this->menuItems["dbinstall"]["active"] = TRUE;

		$titleString = "Admin panel | Icons";

		$this->buildCSS();

		include(ADMIN_TPL_PATH."dbinstall.tpl");
	}


	public function update()
	{
		if (!$this->isPOST())
			return;

		$this->dbVer->autoUpdate();

		setLocation(BASEURL."admin/dbinstall");
	}
}
