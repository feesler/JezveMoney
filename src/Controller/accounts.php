<?php

class AccountsController extends Controller
{
	protected function onStart()
	{
		$this->model = AccountModel::getInstance();
	}


	public function index()
	{
		$transMod = TransactionModel::getInstance();

		$tilesArr = $this->model->getTilesArray();

		$titleString = "Jezve Money | Accounts";

		array_push($this->css->libs, "tiles.css", "iconlink.css", "toolbar.css");
		$this->buildCSS();
		array_push($this->jsArr, "selection.js", "currency.js", "toolbar.js", "accounts.js");

		include("./view/templates/accounts.tpl");
	}


	public function create()
	{
		if ($this->isPOST())
		{
			$this->createAccount();
			return;
		}

		$action = "new";

		$currMod = CurrencyModel::getInstance();

		$accInfo = new stdClass;
		$accInfo->name = "";
		$accInfo->curr_id = $currMod->getIdByPos(0);
		$accInfo->balance = 0;
		$accInfo->initbalance = 0;
		$accInfo->icon = 0;
		$accInfo->iconclass = "";

		$currObj = $currMod->getItem($accInfo->curr_id);
		if (!$currObj)
			throw new Error("Currency not found");

		$accInfo->sign = $currObj->sign;
		$accInfo->balfmt = $currMod->format($accInfo->balance, $accInfo->curr_id);
		$tileAccName = "New account";

		$currArr = $currMod->getData();
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
			Message::set($msg);
		setLocation(BASEURL."accounts/");
	}


	public function update()
	{
		if ($this->isPOST())
		{
			$this->updateAccount();
			return;
		}

		$action = "edit";

		$currMod = CurrencyModel::getInstance();

		$acc_id = intval($this->actionParam);
		if (!$acc_id)
			$this->fail();

		$accInfo = $this->model->getItem($acc_id);

		$currObj = $currMod->getItem($accInfo->curr_id);
		$accInfo->sign = ($currObj) ? $currObj->sign : NULL;
		$accInfo->iconclass = $this->model->getIconClass($accInfo->icon);
		$accInfo->balfmt = $currMod->format($accInfo->balance, $accInfo->curr_id);
		$tileAccName = $accInfo->name;

		$currArr = $currMod->getData();
		$icons = $this->model->getIconsArray();

		$titleString = "Jezve Money | ";
		$headString = "Edit account";
		$titleString .= $headString;

		array_push($this->css->libs, "iconlink.css", "ddlist.css", "tiles.css");
		$this->buildCSS();
		array_push($this->jsArr, "selection.js", "currency.js", "account.js", "ddlist.js", "accounts.js");

		include("./view/templates/account.tpl");
	}


	protected function createAccount()
	{
		if (!$this->isPOST())
			setLocation(BASEURL."accounts/");

		$defMsg = ERR_ACCOUNT_CREATE;

		if (!isset($_POST["accname"]) || !isset($_POST["balance"]) || !isset($_POST["currency"]) || !isset($_POST["icon"]))
			$this->fail($defMsg);

		$uObj = $this->uMod->getItem($this->user_id);
		if (!$uObj)
			$this->fail($defMsg);
		if (!$this->model->create([ "owner_id" => $uObj->owner_id,
								"name" => $_POST["accname"],
								"balance" => $_POST["balance"],
								"curr_id" => $_POST["currency"],
								"icon" => $_POST["icon"] ]))
			$this->fail($defMsg);

		Message::set(MSG_ACCOUNT_CREATE);

		setLocation(BASEURL."accounts/");
	}


	protected function updateAccount()
	{
		if (!$this->isPOST())
			setLocation(BASEURL."accounts/");

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

		Message::set(MSG_ACCOUNT_UPDATE);

		setLocation(BASEURL."accounts/");
	}


	public function del()
	{
		if (!$this->isPOST())
			setLocation(BASEURL."accounts/");

		$defMsg = ERR_ACCOUNT_DELETE;

		if (!isset($_POST["accounts"]))
			fail($defMsg);

		$ids = explode(",", rawurldecode($_POST["accounts"]));
		if (!$this->model->del($ids))
			$this->fail($defMsg);

		Message::set(MSG_ACCOUNT_DELETE);

		setLocation(BASEURL."accounts/");
	}
}