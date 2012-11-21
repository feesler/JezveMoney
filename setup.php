<?php
	$docroot = $_SERVER["DOCUMENT_ROOT"];
	$rootdir = "/money/";

	require_once($docroot.$rootdir."class/mysql.php");

	function setLocation($loc)
	{
		header("Location: ".$loc);
	}

	$sitetheme = 1;

	$db = new mysqlDB();
	if (!$db->connect("localhost", "feesler", "liXhcEIMEe"))
		exit();

	if (!$db->selectDB("feesler"))
		exit();

	$db->rawQ("SET NAMES 'utf8';");
	date_default_timezone_set('Europe/Moscow');

	require_once($docroot.$rootdir."common.php");
?>