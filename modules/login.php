<?php
	require_once("../setup.php");


	function fail()
	{
		setMessage(ERR_LOGIN_FAIL);
		setLocation("../login.php");
	}


	$userid = User::check();
	if ($userid != 0)
		setLocation("../index.php");

	if (!isset($_POST["login"]) || !isset($_POST["password"]))
		fail();

	if (!User::login($_POST["login"], $_POST["password"]))
		fail();

	setMessage(MSG_LOGIN);
	setLocation("../index.php");

?>