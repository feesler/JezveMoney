<?php

namespace JezveMoney;

require_once("./system/defines.php");
require_once("./system/setup.php");

$router = new Core\Router();
$router->setNamespace("JezveMoney\\App\\Controller");
$router->setRoutes([
    "main" => "Main",
    "accounts" => "Accounts",
    "persons" => "Persons",
    "transactions" => "Transactions",
    "profile" => "Profile",
    "statistics" => "Statistics",
    "user" => "User",
    "import" => "Import"
]);

$router->setAliases([
    "login" => "user/login",
    "logout" => "user/logout",
    "register" => "user/register",
    "about" => "main/about",
]);

$router->onStart(function ($controller, $contrStr, $routeParts) {
    // Check correct user authentication for controller
    $loggedOutControllers = ["user/login", "user/register"];
    $rebuildRoute = $contrStr . (count($routeParts) ? "/" . $routeParts[0] : "");
    $isLogOutCont = in_array($rebuildRoute, $loggedOutControllers);

    $controller->checkUser(!$isLogOutCont);
});

$router->onBeforeAction(function ($controller, $contrStr, $action) {
    $controller->initDefResources();
});

$router->route();
