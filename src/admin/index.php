<?php
	$controller = NULL;
	$action = NULL;

	$controllersMap = ["index" => "MainAdminController",
							"currency" => "CurrencyAdminController",
							"query" => "QueryAdminController",
							"log" => "LogsAdminController",
							"tests" => "TestsAdminController",
							"apitest" => "APITestAdminController",
							"user" => "UserAdminController"];

	$actionsMap = ["new" => "create",
						"edit" => "update",
						"chpwd" => "changePassword"];

	// Parse route
	$route = (isset($_GET["route"])) ? $_GET["route"] : "";
	$route = trim($route, "/\\");
	$routeParts = explode("/", $route);

	// Prepare controller
	$contrStr = array_shift($routeParts);
	if (!$contrStr)
		$contrStr = "index";

	if ($contrStr == "log")
		$noLogs = TRUE;

	require_once("../system/setup.php");
	require_once("../system/admin.php");

	if (!isset($controllersMap[$contrStr]))
		setLocation(BASEURL);

	$contClass = $controllersMap[$contrStr];

	$controller = new $contClass();
	$controller->checkUser(TRUE, TRUE);

	// Prepare action
	$action = array_shift($routeParts);
	if (!$action)
		$action = "index";

	// Rewrite action if needed
	if (isset($actionsMap[$action]))
		$action = $actionsMap[$action];

	$controller->action = $action;

	$actionParam = array_shift($routeParts);
	$controller->actionParam = $actionParam;

	$controller->initDefResources();

	if (method_exists($controller, $action))
		$controller->$action();
