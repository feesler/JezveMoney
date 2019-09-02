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
		$this->jsAdmin[] = "tests/page.js";
		$this->jsAdmin[] = "tests/loginpage.js";
		$this->jsAdmin[] = "tests/mainpage.js";
		$this->jsAdmin[] = "tests/profilepage.js";
		$this->jsAdmin[] = "tests/accountspage.js";
		$this->jsAdmin[] = "tests/accountpage.js";
		$this->jsAdmin[] = "tests/personspage.js";
		$this->jsAdmin[] = "tests/personpage.js";
		$this->jsAdmin[] = "tests/transactionpage.js";
		$this->jsAdmin[] = "tests/transaction/expense.js";
		$this->jsAdmin[] = "tests/transaction/income.js";
		$this->jsAdmin[] = "tests/transaction/transfer.js";
		$this->jsAdmin[] = "tests/main.js";

		include("./view/templates/tests.tpl");
	}
}
