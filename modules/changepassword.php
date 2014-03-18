<?php
	require_once("../setup.php");


	function fail()
	{
		setMessage(ERR_PROFILE_PASSWORD);
		setLocation("../profile.php");
	}


	$user_id = User::check();
	if (!$user_id)
		setLocation("../login.php");

	if (!isset($_POST["oldpwd"]) || !isset($_POST["newpwd"]))
		fail();

	$login = User::getName($user_id);
	if (!User::changePassword($login, $_POST["oldpwd"], $_POST["newpwd"]))
		fail();

	setMessage(MSG_PROFILE_PASSWORD);
	setLocation("../profile.php");

?>