<?php

namespace JezveMoney;

require_once("../system/defines.php");
require_once("../system/setup.php");

$router = new Core\Router();
$router->setNamespace("JezveMoney\\App\\API\\Controller");
$router->setRoutes([
    "currency" => "Currency",
    "usercurrency" => "UserCurrency",
    "color" => "Color",
    "icon" => "Icon",
    "import" => "Import",
    "importtpl" => "ImportTemplate",
    "importrule" => "ImportRule",
    "importcond" => "ImportCondition",
    "importaction" => "ImportAction",
    "account" => "Account",
    "person" => "Person",
    "transaction" => "Transaction",
    "schedule" => "ScheduledTransaction",
    "reminder" => "Reminder",
    "category" => "Category",
    "user" => "User",
    "profile" => "Profile",
    "state" => "State",
    "systemsettings" => "SystemSettings",
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
    $loggedOutControllers = ["user/login", "user/register", "state/version"];
    $rebuildRoute = $contrStr . (count($routeParts) ? "/" . $routeParts[0] : "");
    $isLogOutCont = in_array($rebuildRoute, $loggedOutControllers);
    $controller->authRequired = !$isLogOutCont;
});

$router->onBeforeAction(function ($controller, $contrStr, $action, $routeParts) {
    if ($controller instanceof Core\ApiController) {
        return $controller->runAction("initAPI");
    }

    return true;
});

$router->route();
