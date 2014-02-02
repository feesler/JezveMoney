<?php
	require_once("../setup.php");


	function fail()
	{
		setMessage(ERR_REGISTER_FAIL);
		setLocation("../registration.php");
	}


	$userid = User::check();
	if ($userid != 0)
		setLocation("../index.php");

	if (!isset($_POST["login"]) || !isset($_POST["password"]) || !isset($_POST["name"]))
		fail();

	if (!User::register($_POST["login"], $_POST["password"], $_POST["name"]))
		fail();

	setMessage(MSG_REGISTER);
	setLocation("../index.php");

?>