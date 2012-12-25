<?php
require_once("../setup.php");


$login = $_POST["logacc"];
$pass = $_POST["logpwd"];
if ($login && $login != "" && $pass && $pass != "")
{
	$qlogin = $db->escape($login);
	$passhash = md5($pass);

	$resArr = $db->selectQ("*", "users", "login=".qnull($qlogin)." AND passhash=".qnull($passhash));
	if (count($resArr) == 1)
	{
		session_start();
		$_SESSION["userid"] = intval($resArr[0]["id"]);

		$expTime = time() + 31536000;	// year after now
		$path = "/money/";
		$domain = "jezve.net";

		setcookie("login", $qlogin, $expTime, $path, $domain);
		setcookie("passhash", $passhash, $expTime, $path, $domain);

		setLocation("../index.php");
		exit();
	}
}

setLocation("../login.php?act=wrong");

?>