<?php

// Prepare root directories
$approot = $_SERVER['DOCUMENT_ROOT'];
if (strpos($approot, DIRECTORY_SEPARATOR) !== strlen($approot) - strlen(DIRECTORY_SEPARATOR)) {
    $approot .= DIRECTORY_SEPARATOR;
}

// Check development or release environment
$productionHost = "jezvemoney.ru";
$devHost = "jezve.net";
$localDevHost = "testsrv";
$avHosts = [$productionHost, $devHost, $localDevHost];
if (!isset($_SERVER["HTTP_HOST"]) || !in_array($_SERVER["HTTP_HOST"], $avHosts)) {
    header("HTTP/1.1 400 Bad Request", true, 400);
    exit;
}

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

$host = $_SERVER["HTTP_HOST"];
define("APP_HOST", $host);

if (strcmp(APP_HOST, $productionHost) == 0) {
    define("APP_PROTOCOL", "https://");
    define("APP_ROOT", $approot);
    define("APP_PATH", "/");
    define("PRODUCTION", true);
    define("LOCAL_DEV", false);
} elseif (strcmp(APP_HOST, $devHost) == 0) {
    define("APP_PROTOCOL", "https://");
    define("APP_ROOT", $approot . "money/");
    define("APP_PATH", "/money/");
    define("PRODUCTION", false);
    define("LOCAL_DEV", false);
} elseif (strcmp(APP_HOST, $localDevHost) == 0) {
    define("APP_PROTOCOL", "https://");
    define("APP_ROOT", $approot);
    define("APP_PATH", "/");
    define("PRODUCTION", false);
    define("LOCAL_DEV", true);
}

require_once(APP_ROOT . "system/common.php");

$domain = domainFromHost($host);
define("APP_DOMAIN", $domain);

// Error settings
if (PRODUCTION) {
    ini_set("display_errors", "0");
    ini_set("display_startup_errors", "0");
    ini_set("error_reporting", 0);
    error_reporting(0);
} else {
    ini_set("display_errors", "1");
    ini_set("display_startup_errors", "1");
    ini_set('error_reporting', E_ALL & ~E_STRICT);
    error_reporting(E_ALL & ~E_STRICT);
}


if (!isSecure() && !LOCAL_DEV) {
    header("HTTP/1.1 302 Found", true, 302);
    header("Location: " . APP_PROTOCOL . APP_HOST . $_SERVER["REQUEST_URI"]);
    exit;
}

define("BASEURL", APP_PROTOCOL . APP_HOST . APP_PATH);

define("TPL_PATH", pathJoin(APP_ROOT, "view", "templates"));
define("ADMIN_TPL_PATH", pathJoin(APP_ROOT, "admin", "view", "templates"));
define("UPLOAD_PATH", pathJoin(APP_ROOT, "system", "uploads"));
define("LOGS_PATH", pathJoin(APP_ROOT, "system", "logs"));

if (!isset($noLogs) || !$noLogs) {
    require_once(APP_ROOT . "system/Logger.php");
    function wlog($str = null)
    {
        \JezveMoney\Core\Logger::write($str);
    }
    bootLog();
} else {
    function wlog()
    {
    }
}

require_once(APP_ROOT . "system/JSON.php");
require_once(APP_ROOT . "vendor/autoload.php");

$dbConfig = (require_once(APP_ROOT . "system/dbsetup.php"));
JezveMoney\Core\MySqlDB::setup($dbConfig);

date_default_timezone_set("Europe/Moscow");

require_once(APP_ROOT . "system/Message.php");
wlog("==================================================");
