<?php

require_once("../setup.php");


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

if (!$db->insertQ("users", array(id, login, passhash), array(NULL, $login, $passhash)))
	fail();
/*
$query = "INSERT INTO users (`id`, `login`, `passhash`) VALUES (NULL, '".$login."', '".$passhash."');";
$result = $db->rawQ($query, $dbcnx);
if (mysql_errno())
	fail();
*/


header("Location: ../index.php");

?>