<?php
	$dev = TRUE;

	$docroot = $_SERVER["DOCUMENT_ROOT"];
	$ruri = $_SERVER["REQUEST_URI"];
	$rootdir = "/money/";

	require_once($docroot.$rootdir."class/mysql.php");

	if ($dev)
	{
		require_once($docroot.$rootdir."class/log.php");

		wlog("\r\nBEGIN");
		wlog("IP: ".$_SERVER["REMOTE_ADDR"]);
		wlog("User agent: ".$userAgent);
		wlog("Referer: ".$_SERVER["HTTP_REFERER"]);
		wlog("Request: ".$ruri);
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