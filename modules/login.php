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

/*
	$login = $_POST["logacc"];
	$pass = $_POST["logpwd"];
	if ($login && $login != "" && $pass && $pass != "")
	{
		$elogin = $db->escape($login);
		if (checkLoginData($elogin, $pass))
		{
			session_start();
			$_SESSION["userid"] = getUserId($login);

			$preHash = createPreHash($login, $pass);

			setupCookies($login, $preHash);

			setLocation("../index.php");
		}
	}

	setLocation("../login.php?act=wrong");
*/

?>