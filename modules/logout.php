<?php

require_once("../setup.php");

session_start();
session_unset();
session_destroy();

deleteCookies();
/*
$expTime = time() - 3600;	// hour before now
$path = "/money/";
$domain = "jezve.net";

setcookie("login", "", $expTime, $path, $domain);
setcookie("passhash", "", $expTime, $path, $domain);
*/

setLocation("../login.php");

?>