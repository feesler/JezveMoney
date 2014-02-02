<?php
	require_once("../setup.php");


	function fail()
	{
		setMessage(ERR_PROFILE_PASSWORD);
		setLocation("../profile.php");
	}


	$userid = User::check();
	if (!$userid)
		setLocation("../login.php");

	if (!isset($_POST["oldpwd"]) || !isset($_POST["newpwd"]))
		fail();

	$login = User::getName($userid);
	if (!User::changePassword($login, $_POST["oldpwd"], $_POST["newpwd"]))
		fail();

	setMessage(MSG_PROFILE_PASSWORD);
	setLocation("../profile.php");

?>