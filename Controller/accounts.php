<?php

class AccountsController extends Controller
{
	public function index()
	{
		global $u, $user_id, $user_name;

		$acc = new Account($user_id);
		$trans = new Transaction($user_id);

		$tilesArr = $acc->getTilesArray();

		$titleString = "Jezve Money | Accounts";

		$cssArr = array("common.css", "tiles.css", "popup.css", "iconlink.css", "toolbar.css");
		$jsArr = array("es5-shim.min.js", "common.js", "app.js", "popup.js", "currency.js", "toolbar.js", "main.js");

		include("./view/templates/accounts.tpl");
	}


	public function create()
	{
		global $u, $user_id, $user_name;

		$acc = new Account($user_id);
		$trans = new Transaction($user_id);

		$accInfo = array("name" => "",
						"curr" => Currency::getIdByPos(0),
						"balance" => 0,
						"initbalance" => 0,
						"icon" => 0,
						"iconclass" => "");
		$accInfo["sign"] = Currency::getSign($accInfo["curr"]);
		$accInfo["balfmt"] = Currency::format($accInfo["balance"], $accInfo["curr"]);

		$currArr = Currency::getArray(TRUE);
		$icons = $acc->getIconsArray();

		$titleString = "Jezve Money | ";
		$headString = "New account";
		$titleString .= $headString;

		$cssArr = array("common.css", "iconlink.css", "ddlist.css", "tiles.css");
		$jsArr = array("es5-shim.min.js", "common.js", "app.js", "currency.js", "account.js", "ddlist.js", "main.js");

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
		global $u, $user_id, $user_name;

		$acc = new Account($user_id);
		$trans = new Transaction($user_id);

		if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
			$this->fail();

		$acc_id = intval($_GET["id"]);
		$accInfo = $acc->getProperties($acc_id);

		$accInfo["balfmt"] = Currency::format($accInfo["balance"], $accInfo["curr"]);

		$currArr = Currency::getArray(TRUE);
		$icons = $acc->getIconsArray();

		$titleString = "Jezve Money | ";
		$headString = ($action == "new") ? "New account" : "Edit account";
		$titleString .= $headString;

		$cssArr = array("common.css", "iconlink.css", "ddlist.css", "tiles.css");
		$jsArr = array("es5-shim.min.js", "common.js", "app.js", "currency.js", "account.js", "ddlist.js", "main.js");
		$cssArr[] = "popup.css";
		$jsArr[] = "popup.js";

		include("./view/templates/account.tpl");
	}


	public function del()
	{

	}

}