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

	if (!isset($_POST["logacc"]) || !isset($_POST["logpwd"]))
		fail();

	if (!User::login($_POST["logacc"], $_POST["logpwd"]))
		fail();

	setLocation("../index.php");

?>