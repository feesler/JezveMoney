<?php
	$dev = TRUE;

	// Prepare root directories
	$pparts = pathinfo(__FILE__);
	$path_length = strrpos($pparts["dirname"], "/");
	$approot = substr(__FILE__, 0, $path_length);

	$path_length = strrpos($approot, "/");
	$docroot = substr(__FILE__, 0, $path_length + 1);

	$approot .= "/";

	define("BASEURL", "http://jezve.net/money_dev/");

	$ruri = $_SERVER["REQUEST_URI"];
	$userAgent = $_SERVER["HTTP_USER_AGENT"];

	require_once($approot."class/mysql.php");

	if (!isset($noLogs))
	{
		require_once($approot."class/log.php");

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
	else
	{
		function wlog(){}
	}

	$route = (isset($_GET["route"])) ? $_GET["route"] : "";


	$sitetheme = 1;

	require_once($approot."system/dbsetup.php");

	$db = new mysqlDB();
	if (!$db->connect($db_location, $db_user, $db_password))
		exit();

	if (!$db->selectDB($db_name))
		exit();

	$db->rawQ("SET NAMES 'utf8';");
	date_default_timezone_set("Europe/Moscow");

	require_once($approot."system/common.php");
	require_once($approot."system/message.php");

	spl_autoload_register("autoLoadClass");
