<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");


	function fail()
	{
		setLocation("../accounts.php?edit=fail");
	}


	$userid = User::check();
	if (!$userid)
		setLocation("../login.php");

	if (!isset($_POST["accid"]) || !isset($_POST["accname"]) || !isset($_POST["balance"]) || !isset($_POST["currency"]))
		fail();

	$acc = new Account($userid);

	if (!$acc->edit($_POST["accid"], $_POST["accname"], $_POST["balance"], $_POST["currency"]))
		fail();

	setLocation("../accounts.php?edit=ok");
?>