<?php
	require_once("../setup.php");


	function fail()
	{
		setMessage(ERR_ACCOUNT_UPDATE);
		setLocation("../accounts.php");
	}


	$user_id = User::check();
	if (!$user_id)
		setLocation("../login.php");

	if (!isset($_POST["accid"]) || !isset($_POST["accname"]) || !isset($_POST["balance"]) || !isset($_POST["currency"]) || !isset($_POST["icon"]))
		fail();

	$acc = new Account($user_id);

	if (!$acc->edit($_POST["accid"], $_POST["accname"], $_POST["balance"], $_POST["currency"], $_POST["icon"]))
		fail();

	setMessage(MSG_ACCOUNT_UPDATE);
	setLocation("../accounts.php");
?>