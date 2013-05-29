<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");


	function fail()
	{
		setLocation("../accounts.php?newacc=fail");
	}


	$user_id = User::check();
	if (!$user_id)
		setLocation("../login.php");

	if (!isset($_POST["accname"]) || !isset($_POST["balance"]) || !isset($_POST["currency"]))
		fail();

	$acc = new Account($user_id);
	$owner_id = User::getOwner($user_id);
	if (!$acc->create($owner_id, $_POST["accname"], $_POST["balance"], $_POST["currency"]))
		fail();

	setLocation("../accounts.php?newacc=ok");
?>