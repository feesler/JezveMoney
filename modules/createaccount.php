<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");


	function fail()
	{
		setMessage(ERR_ACCOUNT_CREATE);
		setLocation("../accounts.php");
	}


	$user_id = User::check();
	if (!$user_id)
		setLocation("../login.php");

	if (!isset($_POST["accname"]) || !isset($_POST["balance"]) || !isset($_POST["currency"]) || !isset($_POST["icon"]))
		fail();

	$acc = new Account($user_id);
	$owner_id = User::getOwner($user_id);
	if (!$acc->create($owner_id, $_POST["accname"], $_POST["balance"], $_POST["currency"], $_POST["icon"]))
		fail();

	setMessage(MSG_ACCOUNT_CREATE);
	setLocation("../accounts.php");
?>