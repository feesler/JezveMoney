<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");


	function fail()
	{
		setLocation("../admin/currency.php?add=fail");
	}


	$user_id = User::check();
	if (!$user_id)
		setLocation("../login.php");

	if (!isset($_POST["curr_name"]) || !isset($_POST["curr_sign"]) || !isset($_POST["curr_format"]))
		fail();

	if (!Currency::create($_POST["curr_name"], $_POST["curr_sign"], $_POST["curr_format"]))
		fail();

	setLocation("../admin/currency.php?add=ok");
?>