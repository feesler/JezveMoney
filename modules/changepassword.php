<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");


	function fail()
	{
		setLocation("../profile.php?act=fail");
	}


	$userid = User::check();
	if (!$userid)
		setLocation("../login.php");

	if (!isset($_POST["oldpwd"]) || !isset($_POST["newpwd"]))
		fail();

	$login = User::getName($userid);
	if (!User::changePassword($login, $_POST["oldpwd"], $_POST["newpwd"]))
		fail();

	setLocation("../profile.php?act=ok");

?>