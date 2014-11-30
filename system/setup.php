<?php
	$dev = TRUE;

	$docroot = $_SERVER["DOCUMENT_ROOT"];
	$ruri = $_SERVER["REQUEST_URI"];
	$userAgent = $_SERVER["HTTP_USER_AGENT"];
	$rootdir = "/money/";

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

		wlog("Headers: ");
		foreach(getallheaders() as $cKey => $cVal)
		{
			wlog($cKey."=".$cVal);
		}
	}


	$sitetheme = 1;

	require_once($docroot.$rootdir."system/dbsetup.php");

	$db = new mysqlDB();
	if (!$db->connect($db_location, $db_user, $db_password))
		exit();

	if (!$db->selectDB($db_name))
		exit();

	$db->rawQ("SET NAMES 'utf8';");
	date_default_timezone_set("Europe/Moscow");

	require_once($docroot.$rootdir."common.php");
	require_once($docroot.$rootdir."message.php");

	spl_autoload_register("autoLoadClass");
?>