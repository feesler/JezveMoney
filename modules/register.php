<?php

require_once("../setup.php");


function fail()
{
	setLocation("../registration.php?act=fail");
	exit();
}


if (!isset($_POST["logacc"]) || $_POST["logacc"] == "" || !isset($_POST["logpwd"]) || $_POST["logpwd"] == "")
	fail();

$login = $_POST["logacc"];
$passhash = createUserHash($login, $_POST["logpwd"]);
$elogin = $db->escape($login);

if (!$db->insertQ("users", array("id", "login", "passhash"), array(NULL, $elogin, $passhash)))
	fail();

/*
$login = mysql_real_escape_string($_POST["logacc"]);
$pass = $_POST["logpwd"];

if (!$login || $login == "" || !$pass || $pass == "")
	fail();

$passhash = md5($pass);

if (!$db->insertQ("users", array("id", "login", "passhash"), array(NULL, $login, $passhash)))
	fail();


*/

setLocation("../index.php");

?>