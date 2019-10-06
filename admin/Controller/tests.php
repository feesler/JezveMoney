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
		$this->jsAdmin[] = "tests/page/page.js";
		$this->jsAdmin[] = "tests/page/loginpage.js";
		$this->jsAdmin[] = "tests/page/mainpage.js";
		$this->jsAdmin[] = "tests/page/profilepage.js";
		$this->jsAdmin[] = "tests/page/accountspage.js";
		$this->jsAdmin[] = "tests/page/accountpage.js";
		$this->jsAdmin[] = "tests/page/personspage.js";
		$this->jsAdmin[] = "tests/page/personpage.js";
		$this->jsAdmin[] = "tests/page/transactionpage.js";
		$this->jsAdmin[] = "tests/page/transaction/expense.js";
		$this->jsAdmin[] = "tests/page/transaction/income.js";
		$this->jsAdmin[] = "tests/page/transaction/transfer.js";
		$this->jsAdmin[] = "tests/page/transaction/debt.js";
		$this->jsAdmin[] = "tests/page/transactionspage.js";

		$this->jsAdmin[] = "tests/run/account.js";
		$this->jsAdmin[] = "tests/run/person.js";
		$this->jsAdmin[] = "tests/run/transaction/expense.js";
		$this->jsAdmin[] = "tests/run/transaction/income.js";
		$this->jsAdmin[] = "tests/run/transaction/transfer.js";
		$this->jsAdmin[] = "tests/run/transaction/debt.js";
		$this->jsAdmin[] = "tests/main.js";

		include("./view/templates/tests.tpl");
	}
}
