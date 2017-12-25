<?php
	$controller = NULL;
	$action = NULL;

	$controllersMap = array("index" => "MainAdminController",
							"currency" => "CurrencyAdminController",
							"query" => "QueryAdminController",
							"log" => "LogsAdminController",
							"apitest" => "APITestAdminController",
							"user" => "UserAdminController");

	$actionsMap = array("new" => "create",
						"edit" => "update",
						"chpwd" => "changePassword");

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

	checkUser(TRUE, TRUE);

	$contClass = $controllersMap[$contrStr];

	$controller = new $contClass();

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
