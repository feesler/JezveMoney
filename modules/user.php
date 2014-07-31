<?php
	require_once("../setup.php");


	function fail($msg = NULL)
	{
		global $action;

		if (!is_null($msg))
			setMessage($msg);
		if ($action == "register")
			setLocation("../register.php");
		else
			setLocation("../login.php");
	}


	$u = new User();
	$user_id = $u->check();

	if (isset($_GET["act"]))
		$action = $_GET["act"];
	if ($action != "login" && $action != "logout" && $action != "register")
		fail();

	if ($action == "login")
		$defMsg = ERR_LOGIN_FAIL;
	else if ($action == "logout")
		$defMsg = MSG_NONE;
	else if ($action == "register")
		$defMsg = ERR_REGISTER_FAIL;

	if ($action == "login" || $action == "register")
	{
		if ($user_id != 0)
			setLocation("../index.php");
	}

	if ($action == "login")
	{
		if (!isset($_POST["login"]) || !isset($_POST["password"]))
			fail($defMsg);

		if (!$u->login($_POST["login"], $_POST["password"]))
			fail($defMsg);

		setMessage(MSG_LOGIN);
	}
	else if ($action == "logout")
	{
		$u = new User();
		$u->logout();

		setLocation("../login.php");
	}
	else if ($action == "register")
	{
		if (!isset($_POST["login"]) || !isset($_POST["password"]) || !isset($_POST["name"]))
			fail($defMsg);

		if (!$u->register($_POST["login"], $_POST["password"], $_POST["name"]))
			fail($defMsg);

		setMessage(MSG_REGISTER);
	}

	setLocation("../index.php");
?>