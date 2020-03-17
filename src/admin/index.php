<?php
	$noLogs = TRUE;

	require_once("../system/setup.php");
	require_once("../system/router.php");

	$router = new Router();
	$router->setRoutes([
		"main" => "MainAdminController",
		"balance" => "BalanceAdminController",
		"currency" => "CurrencyAdminController",
		"query" => "QueryAdminController",
		"log" => "LogsAdminController",
		"tests" => "TestsAdminController",
		"apiconsole" => "ApiConsoleAdminController",
		"user" => "UserAdminController"
	]);

	$router->setActionsMap([
		"new" => "create",
		"edit" => "update",
		"chpwd" => "changePassword"
	]);

	$router->onStart(function($controller, $contrStr)
	{
		global $noLogs;

		if ($contrStr != "log")
			$noLogs = FALSE;

		$controller->checkUser(TRUE, TRUE);
	});

	$router->onBeforeAction(function($controller, $contrStr, $action, $routeParts)
	{
		$controller->initDefResources();
	});


	$router->route();

