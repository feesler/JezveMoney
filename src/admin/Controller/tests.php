<?php

class TestsAdminController extends Controller
{
	public function index()
	{
		global $menuItems;

		$titleString = "Admin panel | Tests";

		$menuItems["tests"]["active"] = TRUE;

		$currMod = CurrencyModel::getInstance();
		$currArr = $currMod->getData();

		$accMod = AccountModel::getInstance();
		$icons = $accMod->getIconsArray();


		$this->cssAdmin[] = "tests.css";
		$this->buildCSS();

		$this->jsAdminModule[] = "tests/browser.js";

		include("./view/templates/tests.tpl");
	}
}
