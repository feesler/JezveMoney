<?php

namespace JezveMoney;

require_once("../system/defines.php");
require_once("../system/setup.php");

$router = new Core\Router();
$router->setNamespace("JezveMoney\\App\\API\\Controller");
$router->setRoutes([
    "currency" => "Currency",
    "usercurrency" => "UserCurrency",
    "icon" => "Icon",
    "import" => "Import",
    "importtpl" => "ImportTemplate",
    "importrule" => "ImportRule",
    "importcond" => "ImportCondition",
    "importaction" => "ImportAction",
    "account" => "Account",
    "person" => "Person",
    "transaction" => "Transaction",
    "category" => "Category",
    "user" => "User",
    "profile" => "Profile",
    "state" => "State"
]);

$router->setAliases([
    "login" => "user/login",
    "logout" => "user/logout",
    "register" => "user/register",
]);

$router->setActionsMap([
    "delete" => "del",
    "list" => "getList"
]);

$router->onStart(function ($controller, $contrStr, $routeParts) {
    // Check correct user authentication for controller
    $loggedOutControllers = ["user/login", "user/register"];
    $rebuildRoute = $contrStr . (count($routeParts) ? "/" . $routeParts[0] : "");
    $isLogOutCont = in_array($rebuildRoute, $loggedOutControllers);
    $controller->authRequired = !$isLogOutCont;
});

$router->onBeforeAction(function ($controller, $contrStr, $action, $routeParts) {
    if ($controller instanceof Core\ApiController) {
        $controller->initAPI();
    }
});

$router->route();
