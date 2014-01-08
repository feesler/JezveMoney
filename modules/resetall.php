<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");
	require_once("../class/person.php");


	function fail()
	{
		setMessage(ERR_PROFILE_RESETALL);
		setLocation("../profile.php");
	}


	$user_id = User::check();
	if (!$user_id)
		setLocation("../login.php");

	$acc = new Account($user_id);

	if (!$acc->reset())
		fail();

	$pers = new Person($user_id);

	if (!$pers->reset())
		fail();


	setMessage(MSG_PROFILE_RESETALL);
	setLocation("../profile.php");
?>