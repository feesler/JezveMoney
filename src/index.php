<?php
	require_once("./system/setup.php");
	require_once("./system/router.php");

	$router = new Router();
	$router->setRoutes([
		"main" => "MainController",
		"accounts" => "AccountsController",
		"persons" => "PersonsController",
		"transactions" => "TransactionsController",
		"profile" => "ProfileController",
		"statistics" => "StatisticsController",
		"user" => "UserController",
		"fastcommit" => "FastCommitController",
		"checkbalance" => "CheckBalanceController"
	]);

	$router->setAliases([
		"login" => "user/login",
		"logout" => "user/logout",
		"register" => "user/register",
	]);

	$router->setActionsMap([
		"new" => "create",
		"edit" => "update"
	]);

	$router->onStart(function($controller, $contrStr, $routeParts)
	{
		// Check correct user authentication for controller
		$loggedOutControllers = ["user/login", "user/register"];
		$rebuildRoute = $contrStr.(count($routeParts) ? "/".$routeParts[0] : "");
		$isLogOutCont = in_array($rebuildRoute, $loggedOutControllers);

		$controller->checkUser(!$isLogOutCont);
	});

	$router->onBeforeAction(function($controller, $contrStr, $action)
	{
		$controller->initDefResources();
	});


	$router->route();
