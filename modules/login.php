<?php
require_once("../setup.php");


$login = $_POST['logacc'];
$pass = $_POST['logpwd'];
if ($login && $login != "" && $pass && $pass != "")
{
	$qlogin = $db->escape($login);
	$passhash = md5($pass);

	$resArr = $db->selectQ("*", "users", "login='".$qlogin."' AND passhash='".$passhash."'");
	if (count($resArr) == 1)
	{
		session_start();
		$_SESSION["userid"] = intval($resArr[0]["id"]);
		setLocation("../index.php");
		exit();
	}
}

setLocation("../login.php?act=wrong");

?>