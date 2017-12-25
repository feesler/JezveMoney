<?php

class AccountsController extends Controller
{
	public function index()
	{
		global $user_id, $user_name;

		$accMod = new AccountModel($user_id);
		$transMod = new TransactionModel($user_id);

		$tilesArr = $accMod->getTilesArray();

		$titleString = "Jezve Money | Accounts";

		array_push($this->css->libs, "tiles.css", "iconlink.css", "toolbar.css");
		$this->buildCSS();
		array_push($this->jsArr, "selection.js", "currency.js", "toolbar.js", "accounts.js");

		include("./view/templates/accounts.tpl");
	}


	public function create()
	{
		global $user_id, $user_name;

		if ($_SERVER["REQUEST_METHOD"] == "POST")
		{
			$this->createAccount();
			return;
		}

		$action = "new";

		$accMod = new AccountModel($user_id);

		$accInfo = array("name" => "",
						"curr" => CurrencyModel::getIdByPos(0),
						"balance" => 0,
						"initbalance" => 0,
						"icon" => 0,
						"iconclass" => "");
		$accInfo["sign"] = CurrencyModel::getSign($accInfo["curr"]);
		$accInfo["balfmt"] = CurrencyModel::format($accInfo["balance"], $accInfo["curr"]);
		$tileAccName = "New account";

		$currArr = CurrencyModel::getArray();
		$icons = $accMod->getIconsArray();

		$titleString = "Jezve Money | ";
		$headString = "New account";
		$titleString .= $headString;

		array_push($this->css->libs, "iconlink.css", "ddlist.css", "tiles.css");
		$this->buildCSS();
		array_push($this->jsArr, "selection.js", "currency.js", "account.js", "ddlist.js", "accounts.js");

		include("./view/templates/account.tpl");
	}


	private function fail($msg = NULL)
	{
		if (!is_null($msg))
			setMessage($msg);
		setLocation(BASEURL."accounts/");
	}


	public function update()
	{
		global $user_id, $user_name;

		if ($_SERVER["REQUEST_METHOD"] == "POST")
		{
			$this->updateAccount();
			return;
		}

		$action = "edit";

		$accMod = new AccountModel($user_id);

		$acc_id = intval($this->actionParam);
		if (!$acc_id)
			$this->fail();

		$accInfo = $accMod->getProperties($acc_id);

		$accInfo["balfmt"] = CurrencyModel::format($accInfo["balance"], $accInfo["curr"]);
		$tileAccName = $accInfo["name"];

		$currArr = CurrencyModel::getArray();
		$icons = $accMod->getIconsArray();

		$titleString = "Jezve Money | ";
		$headString = ($action == "new") ? "New account" : "Edit account";
		$titleString .= $headString;

		array_push($this->css->libs, "iconlink.css", "ddlist.css", "tiles.css");
		$this->buildCSS();
		array_push($this->jsArr, "selection.js", "currency.js", "account.js", "ddlist.js", "accounts.js");

		include("./view/templates/account.tpl");
	}


	public function createAccount()
	{
		global $uMod, $user_id;

		$defMsg = ERR_ACCOUNT_CREATE;

		if (!isset($_POST["accname"]) || !isset($_POST["balance"]) || !isset($_POST["currency"]) || !isset($_POST["icon"]))
			$this->fail($defMsg);

		$accMod = new AccountModel($user_id);
		$owner_id = $uMod->getOwner($user_id);
		if (!$accMod->create($owner_id, $_POST["accname"], $_POST["balance"], $_POST["currency"], $_POST["icon"]))
			$this->fail($defMsg);

		setMessage(MSG_ACCOUNT_CREATE);

		setLocation(BASEURL."accounts/");
	}


	public function updateAccount()
	{
		global $user_id;

		$defMsg = ERR_ACCOUNT_UPDATE;

		if (!isset($_POST["accname"]) || !isset($_POST["balance"]) || !isset($_POST["currency"]) || !isset($_POST["icon"]))
			$this->fail($defMsg);
		if (!isset($_POST["accid"]))
			$this->fail($defMsg);

		$accMod = new AccountModel($user_id);
		if (!$accMod->edit($_POST["accid"], $_POST["accname"], $_POST["balance"], $_POST["currency"], $_POST["icon"]))
			$this->fail($defMsg);

		setMessage(MSG_ACCOUNT_UPDATE);

		setLocation(BASEURL."accounts/");
	}


	public function del()
	{
		global $user_id;

		if ($_SERVER["REQUEST_METHOD"] != "POST")
			setLocation(BASEURL."accounts/");

		$defMsg = ERR_ACCOUNT_DELETE;

		if (!isset($_POST["accounts"]))
			fail($defMsg);

		$accMod = new AccountModel($user_id);

		$acc_arr = explode(",", $_POST["accounts"]);
		foreach($acc_arr as $acc_id)
		{
			$acc_id = intval($acc_id);
			if (!$accMod->del($acc_id))
				$this->fail($defMsg);
		}

		setMessage(MSG_ACCOUNT_DELETE);

		setLocation(BASEURL."accounts/");
	}


	public function reset()
	{
		global $user_id;

		if ($_SERVER["REQUEST_METHOD"] != "POST")
			setLocation(BASEURL."accounts/");

		$defMsg = ERR_ACCOUNTS_RESET;

		$accMod = new AccountModel($user_id);

		if (!$accMod->reset())
			fail($defMsg);
		setMessage(MSG_ACCOUNTS_RESET);

		setLocation(BASEURL."accounts/");
	}
}