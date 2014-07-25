<?php
	require_once("./setup.php");

	function fail($msg = NULL)
	{
		if (!is_null($msg))
			setMessage($msg);
		setMessage(ERR_ACCOUNT_UPDATE);
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
		$accInfo = array("name" => "New account");
		$accInfo["curr"] = Currency::getIdByPos(0);
		$accInfo["sign"] = Currency::getSign($accInfo["curr"]);
		$accInfo["balance"] = 0.0;
	}
	$accInfo["balfmt"] = Currency::format($accInfo["balance"], $accInfo["curr"]);

	$currArr = Currency::getArray(TRUE);
	$icons = $acc->getIconsArray();

	$titleString = "Jezve Money | ";
	$headString = ($action == "new") ? "New account" : "Edit account";
	$titleString .= $headString;

	$cssArr = array("common.css", "iconlink.css", "ddlist.css", "tiles.css");
	$jsArr = array("common.js", "ready.js", "currency.js", "account.js", "ddlist.js", "main.js");
	if ($action == "edit")
	{
		$cssArr[] = "popup.css";
		$jsArr[] = "popup.js";
	}

	if ($action == "edit")
		include("./templates/editaccount.tpl");
	else
		include("./templates/newaccount.tpl");
?>