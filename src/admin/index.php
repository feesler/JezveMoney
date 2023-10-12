<?php

namespace JezveMoney;

require_once("../system/defines.php");
require_once("../system/setup.php");

$router = new Core\Router();
$router->setNamespace("JezveMoney\\App\\Admin\\Controller");
$router->setRoutes([
    "main" => "Main",
    "balance" => "Balance",
    "currency" => "Currency",
    "color" => "Color",
    "icon" => "Icon",
    "log" => "Logs",
    "tests" => "Tests",
    "apiconsole" => "ApiConsole",
    "user" => "User"
]);

$router->setAliases([
    "update" => "main/update",
]);

$router->setActionsMap([
    "chpwd" => "changePassword"
]);

$router->onStart(function ($controller) {
    $controller->checkUser(true, true);
});

$router->onBeforeAction(function ($controller) {
    $controller->initDefResources();
    return true;
});

$router->route();
