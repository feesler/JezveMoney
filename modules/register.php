<?php
	require_once("../setup.php");


	function fail()
	{
		setMessage(ERR_REGISTER_FAIL);
		setLocation("../registration.php");
	}


	$u = new User();
	$user_id = $u->check();
	if ($user_id != 0)
		setLocation("../index.php");

	if (!isset($_POST["login"]) || !isset($_POST["password"]) || !isset($_POST["name"]))
		fail();

	if (!$u->register($_POST["login"], $_POST["password"], $_POST["name"]))
		fail();

	setMessage(MSG_REGISTER);
	setLocation("../index.php");

?>