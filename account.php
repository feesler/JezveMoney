<?php
	require_once("./system/setup.php");

	function fail($msg = NULL)
	{
		if (!is_null($msg))
			setMessage($msg);
		setLocation("./accounts.php");
	}

	checkUser();

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

	if (isset($_GET["act"]))
		$action = $_GET["act"];
	else
		$action = "new";
	if ($action != "new" && $action != "edit")
		fail();

	if ($action == "edit")
	{
		if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
			fail();

		$acc_id = intval($_GET["id"]);
		$accInfo = $acc->getProperties($acc_id);
	}
	else
	{
		$accInfo = array("name" => "",
						"curr" => Currency::getIdByPos(0),
						"balance" => 0,
						"initbalance" => 0,
						"icon" => 0,
						"iconclass" => "");
		$accInfo["sign"] = Currency::getSign($accInfo["curr"]);
	}
	$accInfo["balfmt"] = Currency::format($accInfo["balance"], $accInfo["curr"]);

	$currArr = Currency::getArray(TRUE);
	$icons = $acc->getIconsArray();

	$titleString = "Jezve Money | ";
	$headString = ($action == "new") ? "New account" : "Edit account";
	$titleString .= $headString;

	$cssArr = array("common.css", "iconlink.css", "ddlist.css", "tiles.css");
	$jsArr = array("es5-shim.min.js", "common.js", "app.js", "ready.js", "currency.js", "account.js", "ddlist.js", "main.js");
	if ($action == "edit")
	{
		$cssArr[] = "popup.css";
		$jsArr[] = "popup.js";
	}

	include("./view/templates/account.tpl");
?>