<?php
	require_once("../setup.php");


	function fail()
	{
		setMessage(ERR_PROFILE_PASSWORD);
		setLocation("../profile.php");
	}


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("../login.php");

	if (!isset($_POST["oldpwd"]) || !isset($_POST["newpwd"]))
		fail();

	$login = $u->getLogin($user_id);
	if (!$u->changePassword($login, $_POST["oldpwd"], $_POST["newpwd"]))
		fail();

	setMessage(MSG_PROFILE_PASSWORD);
	setLocation("../profile.php");

?>