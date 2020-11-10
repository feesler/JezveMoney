<?php

namespace JezveMoney;

$noLogs = true;
require_once("../system/defines.php");
require_once("../system/setup.php");

$router = new Core\Router();
$router->setNamespace("JezveMoney\\App\\Admin\\Controller");
$router->setRoutes([
    "main" => "Main",
    "dbinstall" => "DBInstall",
    "balance" => "Balance",
    "currency" => "Currency",
    "icon" => "Icon",
    "importtpl" => "ImportTemplate",
    "query" => "Query",
    "log" => "Logs",
    "tests" => "Tests",
    "apiconsole" => "ApiConsole",
    "user" => "User"
]);

$router->setActionsMap([
    "new" => "create",
    "edit" => "update",
    "chpwd" => "changePassword"
]);

$router->onStart(function ($controller, $contrStr) {
    setLogs($contrStr != "log");
    $controller->checkUser(true, true);
});

$router->onBeforeAction(function ($controller, $contrStr, $action, $routeParts) {

    $controller->initDefResources();
});

$router->route();
