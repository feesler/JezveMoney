<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");


	User::logout();

/*
	session_start();
	session_unset();
	session_destroy();

	deleteCookies();
*/

	setLocation("../login.php");

?>