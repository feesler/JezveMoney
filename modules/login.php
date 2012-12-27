<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");


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
			exit();
		}
	}

	setLocation("../login.php?act=wrong");

?>