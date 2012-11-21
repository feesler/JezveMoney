<?php
require_once("../setup.php");


$login = $_POST['logacc'];
$pass = $_POST['logpwd'];
if ($login && $login != "" && $pass && $pass != "")
{
	$qlogin = mysql_real_escape_string($login);
	$passhash = md5($pass);

	$query = "SELECT * FROM `users` WHERE `login`='".$qlogin."' AND `passhash`='".$passhash."';";
	$result = $db->rawQ($query, $dbcnx);
	if (!mysql_errno() && mysql_num_rows($result) == 1)
	{
		$row = mysql_fetch_array($result);
		if ($row)
		{
			session_start();
			$_SESSION["userid"] = $row["id"];
			header("Location: ../index.php");
			exit();
		}
	}
}

header("Location: ../login.php?act=wrong");
exit();

?>