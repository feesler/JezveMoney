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
		$_SESSION["userid"] = $row["id"];
		header("Location: ../index.php");
		exit();
	}
}

header("Location: ../login.php?act=wrong");
exit();

?>