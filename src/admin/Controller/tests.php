<?php

class TestsAdminController extends AdminController
{
	public function index()
	{
		$titleString = "Admin panel | Tests";

		$this->menuItems["tests"]["active"] = TRUE;

		$currMod = CurrencyModel::getInstance();
		$currArr = $currMod->getData();

		$iconMod = IconModel::getInstance();
		$icons = $iconMod->getData();

		$this->cssAdmin[] = "tests.css";
		$this->buildCSS();

		$this->jsArr = ["common.js", "ajax.js", "popup.js", "app.js"];
		$this->jsAdmin[] = "tests/index.js";

		include(ADMIN_TPL_PATH."tests.tpl");
	}
}
