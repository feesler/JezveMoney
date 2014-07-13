<?php
	require_once("./setup.php");


	function fail()
	{
		setMessage(ERR_ACCOUNT_UPDATE);
		setLocation("./accounts.php");
	}


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("./login.php");

	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
		fail();

	$acc_id = intval($_GET["id"]);

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

	if (!$acc->is_exist($acc_id))
		fail();

	$acc_name = $acc->getName($acc_id);
	$acc_curr = $acc->getCurrency($acc_id);
	$acc_bal = $acc->getBalance($acc_id);
	$acc_initbal = $acc->getInitBalance($acc_id);
	$acc_icon_id = $acc->getIcon($acc_id);
	$acc_icon = $acc->getIconClass($acc_icon_id);
	$balance_fmt = Currency::format($acc_bal, $acc_curr);

	$curr_sign = Currency::getSign($acc_curr);

	$currArr = Currency::getArray(TRUE);
	$icons = $acc->getIconsArray();

	$titleString = "Jezve Money | Edit account";

	$cssArr = array("common.css", "tiles.css", "iconlink.css", "ddlist.css", "popup.css");
	$jsArr = array("common.js", "ready.js", "popup.js", "currency.js", "account.js", "ddlist.js", "main.js");

	include("./templates/editaccount.tpl");
?>