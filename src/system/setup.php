<?php

$noLogs = true;

defineHostConstants();

require_once(APP_ROOT . "system/common.php");

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

if (!isSecure()) {
    header("HTTP/1.1 302 Found", true, 302);
    header("Location: " . APP_PROTOCOL . APP_HOST . $_SERVER["REQUEST_URI"]);
    exit;
}

require_once(APP_ROOT . "system/Engine/JSON.php");
require_once(APP_ROOT . "vendor/autoload.php");

setupLogs();

$dbConfig = (require_once(APP_ROOT . "system/dbsetup.php"));
JezveMoney\Core\MySqlDB::setup($dbConfig);

date_default_timezone_set("Europe/Moscow");

require_once(APP_ROOT . "system/Engine/Message.php");
require_once(APP_ROOT . "system/msg_defines.php");
require_once(APP_ROOT . "system/messages.php");
wlog("==================================================");
