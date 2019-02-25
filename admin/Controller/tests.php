<?php

class TestsAdminController extends Controller
{
	public function index()
	{
		global $menuItems, $user_id;

		$titleString = "Admin panel | Tests";

		$menuItems["tests"]["active"] = TRUE;

		$currMod = new CurrencyModel();
		$currArr = $currMod->getArray();

		$accMod = new AccountModel($user_id);
		$icons = $accMod->getIconsArray();


		$this->cssAdmin[] = "tests.css";
		$this->buildCSS();
		$this->jsArr[] = "currency.js";
		$this->jsAdmin[] = "tests/common.js";
		$this->jsAdmin[] = "tests/accountpage.js";
		$this->jsAdmin[] = "tests/transactionpage.js";
		$this->jsAdmin[] = "tests/main.js";

		include("./view/templates/tests.tpl");
	}
}
