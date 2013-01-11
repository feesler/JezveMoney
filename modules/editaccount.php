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

	if (!isset($_POST["accid"]) || !isset($_POST["accname"]) || !isset($_POST["acccurr"]) || !isset($_POST["initbal"]))
		fail();

	$acc = new Account($userid);

	if (!$acc->edit($_POST["accid"], $_POST["accname"], $_POST["initbal"], $_POST["acccurr"]))
		fail();

	setLocation("../accounts.php?edit=ok");
?>