<?php
	require_once("./setup.php");


	function fail()
	{
		setMessage(ERR_ACCOUNT_UPDATE);
		setLocation("./accounts.php");
	}


	checkUser();

	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
		fail();

	$acc_id = intval($_GET["id"]);

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

	if (!$acc->is_exist($acc_id))
		fail();

	$accInfo = $acc->getProperties($acc_id);
	$accInfo["balfmt"] = Currency::format($accInfo["balance"], $accInfo["curr"]);

	$currArr = Currency::getArray(TRUE);
	$icons = $acc->getIconsArray();

	$titleString = "Jezve Money | Edit account";

	$cssArr = array("common.css", "tiles.css", "iconlink.css", "ddlist.css", "popup.css");
	$jsArr = array("common.js", "ready.js", "popup.js", "currency.js", "account.js", "ddlist.js", "main.js");

	include("./templates/editaccount.tpl");
?>