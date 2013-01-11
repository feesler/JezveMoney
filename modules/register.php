<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");


	function fail()
	{
		setLocation("../registration.php?act=fail");
	}


	$userid = User::check();
	if ($userid != 0)
		setLocation("../index.php");

	if (!isset($_POST["logacc"]) || !isset($_POST["logpwd"]))
		fail();

	if (!User::register($_POST["logacc"], $_POST["logpwd"]))
		fail();

/*
	if (!isset($_POST["logacc"]) || $_POST["logacc"] == "" || !isset($_POST["logpwd"]) || $_POST["logpwd"] == "")
		fail();

	$login = $_POST["logacc"];
	$passhash = createUserHash($login, $_POST["logpwd"]);
	$elogin = $db->escape($login);

	if (!$db->insertQ("users", array("id", "login", "passhash"), array(NULL, $elogin, $passhash)))
		fail();
*/

	setLocation("../index.php");

?>