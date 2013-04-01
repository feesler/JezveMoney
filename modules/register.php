<?php
	require_once("../setup.php");
	require_once($docroot.$rootdir."class/person.php");
	require_once($docroot.$rootdir."class/user.php");
	require_once($docroot.$rootdir."class/currency.php");
	require_once($docroot.$rootdir."class/account.php");
	require_once("../class/person.php");


	function fail()
	{
		setLocation("../registration.php?act=fail");
	}


	$userid = User::check();
	if ($userid != 0)
		setLocation("../index.php");

	if (!isset($_POST["logacc"]) || !isset($_POST["logpwd"]) || !isset($_POST["username"]))
		fail();

	if (!User::register($_POST["logacc"], $_POST["logpwd"], $_POST["username"]))
		fail();

	setLocation("../index.php");

?>