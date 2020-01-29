<?php

class TestsAdminController extends AdminController
{
	public function index()
	{
		$titleString = "Admin panel | Tests";

		$this->menuItems["tests"]["active"] = TRUE;

		$currMod = CurrencyModel::getInstance();
		$currArr = $currMod->getData();

		$accMod = AccountModel::getInstance();
		$icons = $accMod->getIconsArray();


		$this->cssAdmin[] = "tests.css";
		$this->buildCSS();

		$this->jsAdminModule[] = "tests/index.js";

		include("./view/templates/tests.tpl");
	}
}
