<?php
	// Prepare root directories
	$pparts = pathinfo(__FILE__);
	$path_length = strrpos($pparts["dirname"], "/");
	$approot = substr(__FILE__, 0, $path_length + 1);
	define("APPROOT", $approot, TRUE);


	// Check request is HTTPS
	function isSecure()
	{
		return (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") || $_SERVER["SERVER_PORT"] == 443;
	}

	$ruri = $_SERVER["REQUEST_URI"];
	$userAgent = $_SERVER["HTTP_USER_AGENT"];

	// Check development or release environment
	$productionHost = "jezvemoney.ru";
	$devHost = "jezve.net";
	$avHosts = array($productionHost, $devHost);

	if (!isset($_SERVER["HTTP_HOST"]) || !in_array($_SERVER["HTTP_HOST"], $avHosts))
	{
		header("HTTP/1.1 400 Bad Request", TRUE, 400);
		exit;
	}

 	define("APPHOST", $_SERVER["HTTP_HOST"], TRUE);
	if (strcmp(APPHOST, $productionHost) == 0)
	{
		define("APPPROT", "https://", TRUE);
		define("APPPATH", "/", TRUE);

		if (!isSecure())
		{
			header("HTTP/1.1 302 Found", TRUE, 302);
			header("Location: ".APPPROT.APPHOST.$ruri);
			exit;
		}
	}
	else if (strcmp(APPHOST, $devHost) == 0)
	{
		define("APPPROT", "http://", TRUE);
		define("APPPATH", "/money/", TRUE);
	}

	define("BASEURL", APPPROT.APPHOST.APPPATH, TRUE);

	if (!isset($noLogs))
	{
		require_once(APPROOT."system/log.php");

		wlog("\r\nBEGIN");
		wlog("BASEURL: ".BASEURL);
		wlog("approot: ".APPROOT);
		wlog("IP: ".$_SERVER["REMOTE_ADDR"]);
		wlog("Time: ".date("r"));
		wlog("Referer: ".$_SERVER["HTTP_REFERER"]);
		wlog("Request: ".$ruri);

		wlog("Headers: ");
		foreach(getallheaders() as $cKey => $cVal)
		{
			wlog($cKey.": ".$cVal);
		}

		if ($_SERVER["REQUEST_METHOD"] == "POST")
		{
			wlog("POST data:");
			wlog(file_get_contents('php://input'));
		}
	}
	else
	{
		function wlog(){}
	}

	$route = (isset($_GET["route"])) ? $_GET["route"] : "";


	$sitetheme = 1;

	require_once(APPROOT."system/common.php");
	spl_autoload_register("autoLoadClass");

	require_once(APPROOT."system/dbsetup.php");

	mysqlDB::setup($db_location, $db_user, $db_password, $db_name);

	date_default_timezone_set("Europe/Moscow");

	require_once(APPROOT."system/message.php");
