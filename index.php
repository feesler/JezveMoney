<?php
	require_once("./system/setup.php");

	$controller = NULL;
	$action = NULL;

	$userCont = "UserController";
	$controllersMap = array("index" => "MainController",
							"accounts" => "AccountsController",
							"persons" => "PersonsController",
							"transactions" => "TransactionsController",
							"profile" => "ProfileController",
							"statistics" => "StatisticsController",
							"login" => $userCont,
							"logout" => $userCont,
							"register" => $userCont,
							"fastcommit" => "FastCommitController",);

	$actionsMap = array("new" => "create",
						"edit" => "update");

	// Parse route
	$route = trim($route, "/\\");
	$routeParts = explode("/", $route);

	// Prepare controller
	$contrStr = array_shift($routeParts);
	if (!$contrStr)
		$contrStr = "index";

	if (!isset($controllersMap[$contrStr]))
		setLocation(BASEURL);

	// Check correct user authentication for controller
	$loggedOutControllers = array("login", "register");
	$isLogOutCont = in_array($contrStr, $loggedOutControllers);

	checkUser(!$isLogOutCont);


	$contClass = $controllersMap[$contrStr];

	$controller = new $contClass();

	// Prepare action
	if ($contClass == "UserController")
		$action = $contrStr;
	else
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
