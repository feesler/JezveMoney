<?php
	// Prepare root directories
	$pparts = pathinfo(__FILE__);
	$path_length = strrpos($pparts["dirname"], DIRECTORY_SEPARATOR);
	$approot = substr(__FILE__, 0, $path_length + 1);
	define("APPROOT", $approot);


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
	$localDevHost = "testsrv:8096";
	$avHosts = [$productionHost, $devHost, $localDevHost];

	if (!isset($_SERVER["HTTP_HOST"]) || !in_array($_SERVER["HTTP_HOST"], $avHosts))
	{
		header("HTTP/1.1 400 Bad Request", TRUE, 400);
		exit;
	}

	$host = $_SERVER["HTTP_HOST"];
 	define("APPHOST", $host);

	$pos = strpos($host, ":");
	if ($pos !== FALSE)
		$domain = substr($host, 0, $pos);
	else
		$domain = $host;

 	define("APPDOMAIN", $domain);

	if (strcmp(APPHOST, $productionHost) == 0)
	{
		define("APPPROT", "https://");
		define("APPPATH", "/");
		define("PRODUCTION", TRUE);
		define("LOCAL_DEV", FALSE);
	}
	else if (strcmp(APPHOST, $devHost) == 0)
	{
		define("APPPROT", "https://");
		define("APPPATH", "/money/");
		define("PRODUCTION", FALSE);
		define("LOCALDEV", FALSE);
	}
	else if (strcmp(APPHOST, $localDevHost) == 0)
	{
		define("APPPROT", "http://");
		define("APPPATH", "/");
		define("PRODUCTION", FALSE);
		define("LOCALDEV", TRUE);
	}

	// Error settings
	if (PRODUCTION)
	{
		ini_set("display_errors","0");
		ini_set("display_startup_errors","0");
		ini_set("error_reporting", 0);
		error_reporting(0);
	}
	else
	{
		ini_set("display_errors","1");
		ini_set("display_startup_errors","1");
		ini_set('error_reporting', E_ALL & ~E_STRICT);
		error_reporting(E_ALL & ~E_STRICT);
	}


	if (!isSecure() && !LOCALDEV)
	{
		header("HTTP/1.1 302 Found", TRUE, 302);
		header("Location: ".APPPROT.APPHOST.$ruri);
		exit;
	}

	define("BASEURL", APPPROT.APPHOST.APPPATH);

	require_once(APPROOT."system/log.php");
	if (!isset($noLogs) || !$noLogs)
	{
		wlog("\r\nBEGIN");
		wlog("BASEURL: ".BASEURL);
		wlog("approot: ".APPROOT);
		wlog("IP: ".$_SERVER["REMOTE_ADDR"]);
		wlog("Time: ".date("r"));
		wlog("Request: ".$_SERVER["REQUEST_METHOD"]." ".$ruri);

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

	$route = (isset($_GET["route"])) ? $_GET["route"] : "";


	$sitetheme = 1;

	require_once(APPROOT."system/common.php");
	spl_autoload_register("autoLoadClass");

	$dbConfig = ( require_once(APPROOT."system/dbsetup.php") );
	mysqlDB::setup($dbConfig);

	date_default_timezone_set("Europe/Moscow");

	require_once(APPROOT."system/message.php");
