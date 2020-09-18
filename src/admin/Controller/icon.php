<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\App\Model\IconModel;


class IconAdminController extends AdminController
{
	protected $model = NULL;


	protected function onStart()
	{
		$this->model = IconModel::getInstance();
	}


	public function index()
	{
		$itemsData = $this->model->getData();
		$typesData = $this->model->getTypes();

		$this->menuItems["icon"]["active"] = TRUE;

		$titleString = "Admin panel | Icons";

		$this->buildCSS();
		$this->cssAdmin[] = "icon.css";

		$this->jsAdmin[] = "icon.js";

		include(ADMIN_TPL_PATH."icon.tpl");
	}
}
