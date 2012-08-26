<?php

require_once("../db.php");


function fail()
{
	header("Location: ../registration.php?act=fail");
	exit();
}


$login = mysql_real_escape_string($_POST['logacc']);
$pass = $_POST['logpwd'];

if (!$login || $login == "" || !$pass || $pass == "")
	fail();

$passhash = md5($pass);

$query = "INSERT INTO users (`id`, `login`, `passhash`) VALUES (NULL, '".$login."', '".$passhash."');";
$result = mysql_query($query, $dbcnx);
if (mysql_errno())
	fail();


header("Location: ../index.php");

?>