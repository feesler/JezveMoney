<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;


class UserAdminController extends AdminController
{
	public function index()
	{
		$uArr = $this->uMod->getData([ "all" => TRUE ]);

		$this->menuItems["users"]["active"] = TRUE;

		$titleString = "Admin panel | Users";

		$this->cssAdmin[] = "currency.css";
		$this->buildCSS();
		$this->jsArr[] = "currency.js";
		$this->jsAdmin[] = "user.js";

		include(ADMIN_TPL_PATH."user.tpl");
	}
}
