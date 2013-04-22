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

	if (!isset($_POST["login"]) || !isset($_POST["password"]) || !isset($_POST["name"]))
		fail();

	if (!User::register($_POST["login"], $_POST["password"], $_POST["name"]))
		fail();

	setLocation("../index.php");

?>