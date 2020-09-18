<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\App\Model\CurrencyModel;


class CurrencyAdminController extends AdminController
{
	protected $model = NULL;


	protected function onStart()
	{
		$this->model = CurrencyModel::getInstance();
	}


	public function index()
	{
		$currArr = $this->model->getData();

		$this->menuItems["curr"]["active"] = TRUE;

		$titleString = "Admin panel | Currency";

		$this->buildCSS();
		$this->cssAdmin[] = "currency.css";

		$this->jsArr[] = "currency.js";
		$this->jsAdmin[] = "currency.js";

		include(ADMIN_TPL_PATH."currency.tpl");
	}
}