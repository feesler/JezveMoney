<?php
	namespace JezveMoney;

	$noLogs = TRUE;

	require_once("../system/setup.php");
	require_once("../system/router.php");

	$router = new Core\Router();
	$router->setNamespace("JezveMoney\\App\\Admin\\Controller");
	$router->setRoutes([
		"main" => "Main",
		"dbinstall" => "DBInstall",
		"balance" => "Balance",
		"currency" => "Currency",
		"icon" => "Icon",
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

