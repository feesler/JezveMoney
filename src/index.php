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
    "categories" => "Categories",
    "transactions" => "Transactions",
    "schedule" => "Schedule",
    "reminders" => "Reminders",
    "profile" => "Profile",
    "settings" => "Settings",
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
    $loggedOutRoutes = ["user/login", "user/register"];
    $anyStatusRoutes = ["main/about"];

    $rebuildRoute = $contrStr . (count($routeParts) ? "/" . $routeParts[0] : "");

    $requiredUserStatus = (in_array($rebuildRoute, $anyStatusRoutes))
        ? null
        : !in_array($rebuildRoute, $loggedOutRoutes);

    $controller->checkUser($requiredUserStatus);
});

$router->onBeforeAction(function ($controller, $contrStr, $action) {
    $controller->initDefResources();
    return true;
});

$router->onAfterAction(function () {
    responseLog();
});

$router->route();
