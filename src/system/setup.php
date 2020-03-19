<?php
	// Prepare root directories
	$pparts = pathinfo(__FILE__);
	$path_length = strrpos($pparts["dirname"], DIRECTORY_SEPARATOR);
	$approot = substr(__FILE__, 0, $path_length + 1);
	define("APP_ROOT", $approot);


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

	$pos = strpos($host, ":");
	if ($pos !== FALSE)
		$domain = substr($host, 0, $pos);
	else
		$domain = $host;

 	define("APP_DOMAIN", $domain);

	if (strcmp(APP_HOST, $productionHost) == 0)
	{
		define("APP_PROTOCOL", "https://");
		define("APP_PATH", "/");
		define("PRODUCTION", TRUE);
		define("LOCAL_DEV", FALSE);
	}
	else if (strcmp(APP_HOST, $devHost) == 0)
	{
		define("APP_PROTOCOL", "https://");
		define("APP_PATH", "/money/");
		define("PRODUCTION", FALSE);
		define("LOCAL_DEV", FALSE);
	}
	else if (strcmp(APP_HOST, $localDevHost) == 0)
	{
		define("APP_PROTOCOL", "http://");
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

	define("TPL_PATH", pathJoin(APP_ROOT, "view", "templates").DIRECTORY_SEPARATOR);
	define("ADMIN_TPL_PATH", pathJoin(APP_ROOT, "admin", "view", "templates").DIRECTORY_SEPARATOR);
	define("UPLOAD_PATH", pathJoin(APP_ROOT, "uploads").DIRECTORY_SEPARATOR);
	define("LOGS_PATH", pathJoin(APP_ROOT, "system", "logs").DIRECTORY_SEPARATOR);

	require_once(APP_ROOT."system/log.php");
	if (!isset($noLogs) || !$noLogs)
	{
		bootLog();
	}

	require_once(APP_ROOT."system/json.php");
	spl_autoload_register("autoLoadClass");
	require_once(APP_ROOT."vendor/autoload.php");

	$dbConfig = ( require_once(APP_ROOT."system/dbsetup.php") );
	mysqlDB::setup($dbConfig);

	date_default_timezone_set("Europe/Moscow");


	require_once(APP_ROOT."system/message.php");

	wlog("==================================================");
