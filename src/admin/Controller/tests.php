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

		$this->jsAdmin[] = "tests/config.js";
		$this->jsAdmin[] = "tests/common.js";
		$this->jsAdmin[] = "tests/browser.js";
		$this->jsAdmin[] = "tests/router.js";
		$this->jsAdmin[] = "tests/api.js";
		$this->jsAdmin[] = "tests/view/testview.js";
		$this->jsAdmin[] = "tests/view/login.js";
		$this->jsAdmin[] = "tests/view/register.js";
		$this->jsAdmin[] = "tests/view/main.js";
		$this->jsAdmin[] = "tests/view/profile.js";
		$this->jsAdmin[] = "tests/view/accounts.js";
		$this->jsAdmin[] = "tests/view/account.js";
		$this->jsAdmin[] = "tests/view/persons.js";
		$this->jsAdmin[] = "tests/view/person.js";
		$this->jsAdmin[] = "tests/view/transaction.js";
		$this->jsAdmin[] = "tests/view/transaction/expense.js";
		$this->jsAdmin[] = "tests/view/transaction/income.js";
		$this->jsAdmin[] = "tests/view/transaction/transfer.js";
		$this->jsAdmin[] = "tests/view/transaction/debt.js";
		$this->jsAdmin[] = "tests/view/transactions.js";
		$this->jsAdmin[] = "tests/view/statistics.js";

		$this->jsAdmin[] = "tests/run/api.js";
		$this->jsAdmin[] = "tests/run/api/account.js";
		$this->jsAdmin[] = "tests/run/api/person.js";
		$this->jsAdmin[] = "tests/run/api/transaction.js";
		$this->jsAdmin[] = "tests/run/profile.js";
		$this->jsAdmin[] = "tests/run/account.js";
		$this->jsAdmin[] = "tests/run/person.js";
		$this->jsAdmin[] = "tests/run/transactions.js";
		$this->jsAdmin[] = "tests/run/transaction/common.js";
		$this->jsAdmin[] = "tests/run/transaction/expense.js";
		$this->jsAdmin[] = "tests/run/transaction/income.js";
		$this->jsAdmin[] = "tests/run/transaction/transfer.js";
		$this->jsAdmin[] = "tests/run/transaction/debt.js";
		$this->jsAdmin[] = "tests/run/statistics.js";
		$this->jsAdmin[] = "tests/main.js";

		include("./view/templates/tests.tpl");
	}
}
