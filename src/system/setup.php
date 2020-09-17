<?php
	// Prepare root directories
	$approot = $_SERVER['DOCUMENT_ROOT'];
	if (strpos($approot, DIRECTORY_SEPARATOR) !== strlen($approot) - strlen(DIRECTORY_SEPARATOR))
		$approot .= DIRECTORY_SEPARATOR;


	// Check request is HTTPS
	function isSecure()
	{
		return (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") || $_SERVER["SERVER_PORT"] == 443;
	}


	function bootLog()
	{
		wlog("\r\n==================================================");
		wlog($_SERVER["REQUEST_METHOD"]." ".$_SERVER["REQUEST_URI"]);
		wlog("BASEURL: ".BASEURL);
		wlog("approot: ".APP_ROOT);
		if (isset($_SERVER["REMOTE_ADDR"]))
			wlog("IP: ".$_SERVER["REMOTE_ADDR"]);
		wlog("Time: ".date("r"));

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


	function domainFromHost($host)
	{
		$pos = strpos($host, ":");
		if ($pos !== FALSE)
			return substr($host, 0, $pos);
		else
			return $host;
	}


	function setLogs($enable)
	{
		global $noLogs;

		$writeBootLog = ($noLogs && $enable);
		$noLogs = !$enable;

		if ($writeBootLog)
			bootLog();
	}


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
 	define("APP_HOST", $host);

	$domain = domainFromHost($host);

 	define("APP_DOMAIN", $domain);

/*
	APP_HOST - application domain and port
	APP_DOMAIN - application domain
	APP_PROTOCOL - http:// or https://
	APP_ROOT - path to the root directory
	APP_PATH - relative path for cookies
	PRODUCTION - is production (boolean)
	LOCAL_DEV - is local development environment
	BASEURL - base URL for project
	TPL_PATH - path to the templates directory
	ADMIN_TPL_PATH - path to the admin templates directory
	UPLOAD_PATH - path to the uploads directory
	LOGS_PATH - path to the logs directory
*/

	if (strcmp(APP_HOST, $productionHost) == 0)
	{
		define("APP_PROTOCOL", "https://");
		define("APP_ROOT", $approot);
		define("APP_PATH", "/");
		define("PRODUCTION", TRUE);
		define("LOCAL_DEV", FALSE);
	}
	else if (strcmp(APP_HOST, $devHost) == 0)
	{
		define("APP_PROTOCOL", "https://");
		define("APP_ROOT", $approot."money/");
		define("APP_PATH", "/money/");
		define("PRODUCTION", FALSE);
		define("LOCAL_DEV", FALSE);
	}
	else if (strcmp(APP_HOST, $localDevHost) == 0)
	{
		define("APP_PROTOCOL", "http://");
		define("APP_ROOT", $approot);
		define("APP_PATH", "/");
		define("PRODUCTION", FALSE);
		define("LOCAL_DEV", TRUE);
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


	if (!isSecure() && !LOCAL_DEV)
	{
		header("HTTP/1.1 302 Found", TRUE, 302);
		header("Location: ".APP_PROTOCOL.APP_HOST.$_SERVER["REQUEST_URI"]);
		exit;
	}

	define("BASEURL", APP_PROTOCOL.APP_HOST.APP_PATH);

	require_once(APP_ROOT."system/common.php");

	define("TPL_PATH", pathJoin(APP_ROOT, "view", "templates"));
	define("ADMIN_TPL_PATH", pathJoin(APP_ROOT, "admin", "view", "templates"));
	define("UPLOAD_PATH", pathJoin(APP_ROOT, "system", "uploads"));
	define("LOGS_PATH", pathJoin(APP_ROOT, "system", "logs"));

	require_once(APP_ROOT."system/log.php");
	if (!isset($noLogs) || !$noLogs)
	{
		bootLog();
	}

	require_once(APP_ROOT."system/json.php");
	spl_autoload_register("autoLoadClass");
	require_once(APP_ROOT."vendor/autoload.php");

	$dbConfig = ( require_once(APP_ROOT."system/dbsetup.php") );
	MySqlDB::setup($dbConfig);

	date_default_timezone_set("Europe/Moscow");


	require_once(APP_ROOT."system/message.php");

	wlog("==================================================");
