<?php

class AccountsController extends Controller
{
	public function __construct()
	{
		global $user_id;

		$this->model = new AccountModel($user_id);
	}


	public function index()
	{
		global $user_id, $user_name, $uMod;

		$transMod = new TransactionModel($user_id);

		$tilesArr = $this->model->getTilesArray();

		$titleString = "Jezve Money | Accounts";

		array_push($this->css->libs, "tiles.css", "iconlink.css", "toolbar.css");
		$this->buildCSS();
		array_push($this->jsArr, "selection.js", "currency.js", "toolbar.js", "accounts.js");

		include("./view/templates/accounts.tpl");
	}


	public function create()
	{
		global $user_id, $user_name, $uMod;

		if ($_SERVER["REQUEST_METHOD"] == "POST")
		{
			$this->createAccount();
			return;
		}

		$action = "new";

		$currMod = new CurrencyModel();

		$accInfo = new stdClass;
		$accInfo->name = "";
		$accInfo->curr = $currMod->getIdByPos(0);
		$accInfo->balance = 0;
		$accInfo->initbalance = 0;
		$accInfo->icon = 0;
		$accInfo->iconclass = "";

		$currObj = $currMod->getItem($accInfo->curr);
		if (!$currObj)
			throw new Error("Currency not found");

		$accInfo->sign = $currObj->sign;
		$accInfo->balfmt = $currMod->format($accInfo->balance, $accInfo->curr);
		$tileAccName = "New account";

		$currArr = $currMod->getArray();
		$icons = $this->model->getIconsArray();

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
		global $user_id, $user_name, $uMod;

		if ($_SERVER["REQUEST_METHOD"] == "POST")
		{
			$this->updateAccount();
			return;
		}

		$action = "edit";

		$currMod = new CurrencyModel();

		$acc_id = intval($this->actionParam);
		if (!$acc_id)
			$this->fail();

		$accInfo = $this->model->getProperties($acc_id);

		$accInfo->balfmt = $currMod->format($accInfo->balance, $accInfo->curr);
		$tileAccName = $accInfo->name;

		$currArr = $currMod->getArray();
		$icons = $this->model->getIconsArray();

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

		$uObj = $uMod->getItem($user_id);
		if (!$uObj)
			$this->fail($defMsg);
		if (!$this->model->create([ "owner_id" => $uObj->owner_id,
								"name" => $_POST["accname"],
								"balance" => $_POST["balance"],
								"curr_id" => $_POST["currency"],
								"icon" => $_POST["icon"] ]))
			$this->fail($defMsg);

		setMessage(MSG_ACCOUNT_CREATE);

		setLocation(BASEURL."accounts/");
	}


	public function updateAccount()
	{
		$defMsg = ERR_ACCOUNT_UPDATE;

		if (!isset($_POST["accname"]) || !isset($_POST["balance"]) || !isset($_POST["currency"]) || !isset($_POST["icon"]))
			$this->fail($defMsg);
		if (!isset($_POST["accid"]))
			$this->fail($defMsg);

		if (!$this->model->update($_POST["accid"],
								[ "name" => $_POST["accname"],
									"balance" => $_POST["balance"],
									"curr_id" => $_POST["currency"],
									"icon" => $_POST["icon"] ]))
			$this->fail($defMsg);

		setMessage(MSG_ACCOUNT_UPDATE);

		setLocation(BASEURL."accounts/");
	}


	public function del()
	{
		if ($_SERVER["REQUEST_METHOD"] != "POST")
			setLocation(BASEURL."accounts/");

		$defMsg = ERR_ACCOUNT_DELETE;

		if (!isset($_POST["accounts"]))
			fail($defMsg);

		$acc_arr = explode(",", $_POST["accounts"]);
		foreach($acc_arr as $acc_id)
		{
			$acc_id = intval($acc_id);
			if (!$this->model->del($acc_id))
				$this->fail($defMsg);
		}

		setMessage(MSG_ACCOUNT_DELETE);

		setLocation(BASEURL."accounts/");
	}


	public function reset()
	{
		if ($_SERVER["REQUEST_METHOD"] != "POST")
			setLocation(BASEURL."accounts/");

		$defMsg = ERR_ACCOUNTS_RESET;

		if (!$this->model->reset())
			fail($defMsg);
		setMessage(MSG_ACCOUNTS_RESET);

		setLocation(BASEURL."accounts/");
	}
}