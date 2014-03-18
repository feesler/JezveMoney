<?php
	require_once("../setup.php");


	function fail()
	{
		setMessage(ERR_ACCOUNTS_RESET);
		setLocation("../profile.php");
	}


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("../login.php");

	$acc = new Account($user_id);
	if (!$acc->reset())
		fail();

	setMessage(MSG_ACCOUNTS_RESET);
	setLocation("../accounts.php");
?>