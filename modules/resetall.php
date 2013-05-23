<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");
	require_once("../class/person.php");


	function fail()
	{
		setLocation("../profile.php?resetall=fail");
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


	setLocation("../profile.php?resetall=ok");
?>