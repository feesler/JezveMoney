<?php

/*
APP_HOST - application domain and port
APP_DOMAIN - application domain
APP_PROTOCOL - http:// or https://
APP_ROOT - path to the root directory
APP_PATH - relative path for cookies
PRODUCTION - is production (bool)
LOCAL_DEV - is local development environment
BASEURL - base URL for project
TPL_PATH - path to the templates directory
ADMIN_TPL_PATH - path to the admin templates directory
UPLOAD_PATH - path to the uploads directory
LOGS_PATH - path to the logs directory
*/

define("APP_VERSION", "1.44.0");
define("APP_PROTOCOL", "https://");

define("PROD_HOST", "jezvemoney.ru");
define("DEV_HOST", "jezve.net");
define("LOCAL_DEV_HOST", "testsrv");

define("DEFAULT_LOCALE", "en");

define("MAX_LOG_SIZE", 1024 * 1024);
define("MAX_LOG_FILES", 10);


/**
 * Returns domain name from specified host string
 *
 * @param string $host
 *
 * @return string
 */
function domainFromHost(string $host)
{
    $pos = strpos($host, ":");
    if ($pos !== false) {
        return substr($host, 0, $pos);
    } else {
        return $host;
    }
}

/**
 * Checks current host is valid
 *
 * @return string
 */
function verifyHost()
{
    $avHosts = [PROD_HOST, DEV_HOST, LOCAL_DEV_HOST];

    if (!isset($_SERVER["HTTP_HOST"]) || !in_array($_SERVER["HTTP_HOST"], $avHosts)) {
        header("HTTP/1.1 400 Bad Request", true, 400);
        exit;
    }

    return $_SERVER["HTTP_HOST"];
}

/**
 * Return application root directory
 *
 * @return string
 */
function getRootDir()
{
    $res = $_SERVER['DOCUMENT_ROOT'];
    if (strpos($res, DIRECTORY_SEPARATOR) !== strlen($res) - strlen(DIRECTORY_SEPARATOR)) {
        $res .= DIRECTORY_SEPARATOR;
    }

    return $res;
}

/**
 * Returns string of joined path segments
 *
 * @param mixed ...$segments
 *
 * @return string
 */
function pathJoin(...$segments)
{
    if (!is_array($segments) || !count($segments)) {
        return "";
    }

    $trimmed = [];
    $res = (strpos($segments[0], DIRECTORY_SEPARATOR) === 0) ? DIRECTORY_SEPARATOR : "";
    foreach ($segments as $segment) {
        $trimmed[] = trim($segment, DIRECTORY_SEPARATOR);
    }

    $res .= implode(DIRECTORY_SEPARATOR, $trimmed) . DIRECTORY_SEPARATOR;

    return $res;
}

/**
 * Initializes host specific constants
 */
function defineHostConstants()
{
    $host = verifyHost();
    $approot = getRootDir();

    define("APP_HOST", $host);
    $domain = domainFromHost($host);
    define("APP_DOMAIN", $domain);

    if (strcmp(APP_HOST, PROD_HOST) == 0) {
        define("APP_ROOT", $approot);
        define("APP_PATH", "/");
        define("PRODUCTION", true);
        define("LOCAL_DEV", false);
    } elseif (strcmp(APP_HOST, DEV_HOST) == 0) {
        define("APP_ROOT", $approot . "money/");
        define("APP_PATH", "/money/");
        define("PRODUCTION", false);
        define("LOCAL_DEV", false);
    } elseif (strcmp(APP_HOST, LOCAL_DEV_HOST) == 0) {
        define("APP_ROOT", $approot);
        define("APP_PATH", "/");
        define("PRODUCTION", false);
        define("LOCAL_DEV", true);
    }

    define("BASEURL", APP_PROTOCOL . APP_HOST . APP_PATH);

    define("TPL_PATH", pathJoin(APP_ROOT, "Template"));
    define("VIEW_TPL_PATH", pathJoin(APP_ROOT, "Template", "View"));
    define("ICONS_PATH", pathJoin(APP_ROOT, "Template", "Icons"));
    define("ADMIN_TPL_PATH", pathJoin(APP_ROOT, "admin", "Template"));
    define("ADMIN_VIEW_TPL_PATH", pathJoin(APP_ROOT, "admin", "Template", "View"));
    define("UPLOAD_PATH", pathJoin(APP_ROOT, "system", "uploads"));
    define("LOGS_PATH", pathJoin(APP_ROOT, "system", "logs"));
}
