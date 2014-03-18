<?php
	require_once("../setup.php");


	function fail()
	{
		setMessage(ERR_CURRENCY_DELETE);
		setLocation("../admin/currency.php");
	}


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("../login.php");

	if (!isset($_POST["curr_id"]))
		fail();

	if (!Currency::del($_POST["curr_id"]))
		fail();

	setMessage(MSG_CURRENCY_DELETE);
	setLocation("../admin/currency.php");
?>