<?php
	require_once("./system/setup.php");

	$controller = NULL;
	$action = NULL;

	$userCont = "UserController";
	$controllersMap = ["index" => "MainController",
							"accounts" => "AccountsController",
							"persons" => "PersonsController",
							"transactions" => "TransactionsController",
							"profile" => "ProfileController",
							"statistics" => "StatisticsController",
							"login" => $userCont,
							"logout" => $userCont,
							"register" => $userCont,
							"fastcommit" => "FastCommitController",
							"checkbalance" => "CheckBalanceController"];

	$actionsMap = ["new" => "create",
						"edit" => "update"];

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
	$loggedOutControllers = ["login", "register"];
	$isLogOutCont = in_array($contrStr, $loggedOutControllers);


	$contClass = $controllersMap[$contrStr];

	$controller = new $contClass();

	$controller->checkUser(!$isLogOutCont);

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

	$actionParam = NULL;
	if (!method_exists($controller, $action))
	{
		$actionParam = $action;
		$action = "index";
	}

	$controller->action = $action;

	if (is_null($actionParam))
		$actionParam = array_shift($routeParts);
	$controller->actionParam = $actionParam;

	$controller->initDefResources();

	if (method_exists($controller, $action))
		$controller->$action();
