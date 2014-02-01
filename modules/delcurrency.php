<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");


	function fail()
	{
		setMessage(ERR_CURRENCY_DELETE);
		setLocation("../admin/currency.php");
	}


	$user_id = User::check();
	if (!$user_id)
		setLocation("../login.php");

	if (!isset($_POST["curr_id"]))
		fail();

	if (!Currency::del($_POST["curr_id"]))
		fail();

	setMessage(MSG_CURRENCY_DELETE);
	setLocation("../admin/currency.php");
?>