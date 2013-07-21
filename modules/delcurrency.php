<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");


	function fail()
	{
		setLocation("../admin/currency.php?del=fail");
	}


	$user_id = User::check();
	if (!$user_id)
		setLocation("../login.php");

	if (!isset($_POST["curr_id"]))
		fail();

	if (!Currency::del($_POST["curr_id"]))
		fail();

	setLocation("../admin/currency.php?del=ok");
?>