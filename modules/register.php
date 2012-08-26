<?php

require_once("./db.php");


$login = $_POST['logacc'];
$pass = $_POST['logpwd'];

if ($login && $login != "" && $pass && $pass != "")
{
	$qlogin = mysql_real_escape_string($login);
	$passhash = md5($pass);

	$query = "INSERT INTO users (`id`, `login`, `passhash`) VALUES (NULL, '".$qlogin."', '".$passhash."');";
	$result = mysql_query($query, $dbcnx);
}

header("Location: ./index.php");

?>