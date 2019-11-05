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

		$this->jsAdmin[] = "tests/common.js";
		$this->jsAdmin[] = "tests/browser.js";
		$this->jsAdmin[] = "tests/router.js";
		$this->jsAdmin[] = "tests/view/testview.js";
		$this->jsAdmin[] = "tests/view/login.js";
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
