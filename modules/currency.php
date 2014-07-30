<?php
	require_once("../setup.php");


	function fail($msg = NULL)
	{
		if (!is_null($msg))
			setMessage($msg);
		setLocation("../admin/currency.php");
	}


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("../login.php");

wlog("1");

	if (isset($_GET["act"]))
		$action = $_GET["act"];
	if ($action != "new" && $action != "edit" && $action != "del")
		fail();

wlog("2");

	if ($action == "new")
		$defMsg = ERR_CURRENCY_CREATE;
	else if ($action == "edit")
		$defMsg = ERR_CURRENCY_UPDATE;
	else if ($action == "del")
		$defMsg = ERR_CURRENCY_DELETE;

	if ($action == "new" || $action == "edit")
	{
		if (!isset($_POST["curr_name"]) || !isset($_POST["curr_sign"]))
			fail($defMsg);

		$curr_format = (isset($_POST["curr_format"]) && $_POST["curr_format"] == "on") ? 1 : 0;
	}

wlog("3");

	if ($action == "edit" || $action == "del")
	{
		if (!isset($_POST["curr_id"]))
			fail($defMsg);
	}

wlog("4");

	if ($action == "new")
	{
		if (!Currency::create($_POST["curr_name"], $_POST["curr_sign"], $curr_format))
			fail($defMsg);

		setMessage(MSG_CURRENCY_CREATE);
	}
	else if ($action == "edit")
	{
		if (!Currency::edit($_POST["curr_id"], $_POST["curr_name"], $_POST["curr_sign"], $curr_format))
			fail($defMsg);

		setMessage(MSG_CURRENCY_UPDATE);
	}
	else if ($action == "del")
	{
		if (!Currency::del($_POST["curr_id"]))
			fail($defMsg);

		setMessage(MSG_CURRENCY_DELETE);
	}

	setLocation("../admin/currency.php");
?>