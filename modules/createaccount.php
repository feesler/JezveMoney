<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");


	function fail()
	{
		setLocation("../accounts.php?newacc=fail");
	}


	$userid = User::check();
	if (!$userid)
		setLocation("../login.php");

	if (!isset($_POST["accname"]) || !isset($_POST["accbalance"]) || !isset($_POST["acccurr"]))
		fail();

	$acc = new Account($userid);
	$owner_id = User::getOwner($userid);
	if (!$acc->create($owner_id, $_POST["accname"], $_POST["accbalance"], $_POST["acccurr"]))
		fail();

	setLocation("../accounts.php?newacc=ok");
?>