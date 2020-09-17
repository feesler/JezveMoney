<?php
	require_once("../system/setup.php");
	require_once("../system/router.php");

	$router = new Router();
	$router->setRoutes([
		"currency" => "CurrencyApiController",
		"icon" => "IconApiController",
		"account" => "AccountApiController",
		"person" => "PersonApiController",
		"transaction" => "TransactionApiController",
		"user" => "UserApiController",
		"profile" => "ProfileApiController",
		"state" => "StateApiController"
	]);

	$router->setAliases([
		"login" => "user/login",
		"logout" => "user/logout",
		"register" => "user/register",
	]);

	$router->setActionsMap([
		"new" => "create",
		"edit" => "update",
		"delete" => "del",
		"list" => "getList"
	]);

	$router->onStart(function($controller, $contrStr, $routeParts)
	{
		// Check correct user authentication for controller
		$loggedOutControllers = ["user/login", "user/register"];
		$rebuildRoute = $contrStr.(count($routeParts) ? "/".$routeParts[0] : "");
		$isLogOutCont = in_array($rebuildRoute, $loggedOutControllers);

		$controller->authRequired = !$isLogOutCont;
	});

	$router->onBeforeAction(function($controller, $contrStr, $action, $routeParts)
	{
		if ($controller instanceof ApiController)
		{
			$controller->initAPI();
		}
	});


	$router->route();
