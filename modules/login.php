<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");


	function fail()
	{
		setLocation("../login.php?act=wrong");
	}


	$userid = User::check();
	if ($userid != 0)
		setLocation("../index.php");

	if (!isset($_POST["login"]) || !isset($_POST["password"]))
		fail();

	if (!User::login($_POST["login"], $_POST["password"]))
		fail();

	setLocation("../index.php");

?>