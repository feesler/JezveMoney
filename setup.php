<?php
	$dev = TRUE;

	$docroot = $_SERVER["DOCUMENT_ROOT"];
	$ruri = $_SERVER["REQUEST_URI"];
	$userAgent = $_SERVER["HTTP_USER_AGENT"];
	$rootdir = "/money_design/";

	require_once($docroot.$rootdir."class/mysql.php");

	if ($dev)
	{
		require_once($docroot.$rootdir."class/log.php");

		wlog("\r\nBEGIN");
		wlog("IP: ".$_SERVER["REMOTE_ADDR"]);
		wlog("Time: ".date("r"));
		wlog("User agent: ".$userAgent);
		wlog("Referer: ".$_SERVER["HTTP_REFERER"]);
		wlog("Request: ".$ruri);
	}


	$sitetheme = 1;

	$db = new mysqlDB();
	if (!$db->connect("localhost", "feesler", "jqmWFX6wEp3ruU"))
		exit();

	if (!$db->selectDB("feesler"))
		exit();

	$db->rawQ("SET NAMES 'utf8';");
	date_default_timezone_set("Europe/Moscow");

	require_once($docroot.$rootdir."common.php");
?>