<?php

use JezveMoney\Core\Locale;
use JezveMoney\Core\MySqlDB;

defineHostConstants();

require_once(APP_ROOT . "system/common.php");
require_once(APP_ROOT . "system/dateUtils.php");
require_once(APP_ROOT . "system/crypt.php");

// Error settings
if (PRODUCTION) {
    ini_set("display_errors", "0");
    ini_set("display_startup_errors", "0");
    ini_set("error_reporting", "0");
    error_reporting(0);
} else {
    ini_set("display_errors", "1");
    ini_set("display_startup_errors", "1");
    ini_set('error_reporting', strval(E_ALL & ~E_STRICT));
    error_reporting(E_ALL & ~E_STRICT);
}

if (!isSecure()) {
    header("HTTP/1.1 302 Found", true, 302);
    header("Location: " . APP_PROTOCOL . APP_HOST . $_SERVER["REQUEST_URI"]);
    exit;
}

require_once(APP_ROOT . "system/Engine/JSON.php");
require_once(APP_ROOT . "vendor/autoload.php");

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

setupLogs();

MySqlDB::setup([
    "name" => $_ENV["DB_NAME"],
    "user" => $_ENV["DB_USER"],
    "password" => $_ENV["DB_PASS"],
    "location" => $_ENV["DB_HOST"],
]);

date_default_timezone_set("UTC");

Locale::loadUserLocale();

require_once(APP_ROOT . "system/Engine/Message.php");

wlog("==================================================");
