<?php
	require_once("./setup.php");


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("./login.php");

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

	$curr_id = Currency::getIdByPos(0);
	$curr_sign = Currency::getSign($curr_id);
	$acc_name = "New account";
	$acc_bal = 0.0;
	$balance_fmt = Currency::format($acc_bal, $curr_id);

	$currArr = Currency::getArray(TRUE);
	$icons = $acc->getIconsArray();

	$titleString = "Jezve Money | New account";

	$cssArr = array("common.css", "iconlink.css", "ddlist.css", "tiles.css");
	$jsArr = array("common.js", "ready.js", "currency.js", "account.js", "ddlist.js", "main.js");

	include("./templates/newaccount.tpl");
?>