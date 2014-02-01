<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");


	function fail()
	{
		setMessage(ERR_ACCOUNTS_RESET);
		setLocation("../profile.php");
	}


	$userid = User::check();
	if (!$userid)
		setLocation("../login.php");

	$acc = new Account($userid);

	if (!$acc->reset())
		fail();

	setMessage(MSG_ACCOUNTS_RESET);
	setLocation("../accounts.php");
?>