<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");


	function fail()
	{
		setMessage(ERR_CURRENCY_UPDATE);
		setLocation("../admin/currency.php");
	}


	$user_id = User::check();
	if (!$user_id)
		setLocation("../login.php");

	if (!isset($_POST["curr_id"]) || !isset($_POST["curr_name"]) || !isset($_POST["curr_sign"]) || !isset($_POST["curr_format"]))
		fail();

	$curr_format = ($_POST["curr_format"] == "on") ? 1 : 0;

	if (!Currency::edit($_POST["curr_id"], $_POST["curr_name"], $_POST["curr_sign"], $curr_format))
		fail();

	setMessage(MSG_CURRENCY_UPDATE);
	setLocation("../admin/currency.php");
?>