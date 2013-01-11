<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");


	function fail()
	{
		setLocation("../resetaccounts.php?act=fail");
		exit();
	}


	session_start();

	$userid = checkUser("../login.php");

	$acc = new Account($userid);

	if (!$acc->reset())
		fail();

	setLocation("../accounts.php?reset=ok");
?>