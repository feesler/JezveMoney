<?php
	namespace JezveMoney;

	$noLogs = TRUE;

	require_once("../system/setup.php");
	require_once("../system/router.php");

	$router = new Core\Router();
	$router->setNamespace("JezveMoney\\App\\Admin\\Controller");
	$router->setRoutes([
		"main" => "MainAdminController",
		"dbinstall" => "DBInstallAdminController",
		"balance" => "BalanceAdminController",
		"currency" => "CurrencyAdminController",
		"icon" => "IconAdminController",
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
		setLogs($contrStr != "log");

		$controller->checkUser(TRUE, TRUE);
	});

	$router->onBeforeAction(function($controller, $contrStr, $action, $routeParts)
	{
		$controller->initDefResources();
	});


	$router->route();

