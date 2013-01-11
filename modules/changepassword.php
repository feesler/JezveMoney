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

/*
	session_start();

	$userid = checkUser("../login.php");


	if (!isset($_POST["oldpwd"]) || $_POST["oldpwd"] == "" || !isset($_POST["newpwd"]) || $_POST["newpwd"] == "")
		fail();

	$login = getUserName($userid);
	$oldpwd = $_POST["oldpwd"];
	$newpwd = $_POST["newpwd"];

	if (!checkLoginData($login, $oldpwd))
		fail();

	$passhash = createUserHash($login, $newpwd);
	if (!$db->updateQ("users", array("passhash"), array($passhash), "id=".$userid))
		fail();

	$preHash = createPreHash($login, $newpwd);
	setupCookies($login, $preHash);
*/

	setLocation("../profile.php?act=ok");

?>