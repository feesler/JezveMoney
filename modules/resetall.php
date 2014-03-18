<?php
	require_once("../setup.php");


	function fail()
	{
		setMessage(ERR_PROFILE_RESETALL);
		setLocation("../profile.php");
	}


	$u = new User();
	$user_id = $u->check();
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