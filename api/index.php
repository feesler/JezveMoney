<?php
	require_once("../system/setup.php");


	$controller = NULL;
	$action = NULL;

	$aliasMap = array("login" => "user/login",
						"register" => "user/register");

	$controllersMap = array("currency" => "CurrencyApiController",
							"account" => "AccountApiController",
							"person" => "PersonApiController",
							"transaction" => "TransactionApiController",
							"user" => "UserApiController",
							"profile" => "ProfileApiController"
							);

	$actionsMap = array("new" => "create",
						"edit" => "update",
						"delete" => "del",
						"list" => "getList");

	// Parse route
	$route = (isset($_GET["route"])) ? $_GET["route"] : "";

	$route = trim($route, "/\\");
	$routeParts = explode("/", $route);

	// Prepare controller
	$contrStr = array_shift($routeParts);
	if (!$contrStr)
		$contrStr = "main";

	// Check aliases
	if (isset($aliasMap[$contrStr]))
	{
		$aliasReplace = $aliasMap[$contrStr];
		wlog("Found alias for ".$contrStr." : ".$aliasReplace);

		$unshiftParts = array_reverse(explode("/", $aliasReplace));
		foreach($unshiftParts as $uPart)
		{
			array_unshift($routeParts, $uPart);
		}
		wlog("Rewrite route as: ".implode("/", $routeParts));

		$contrStr = array_shift($routeParts);
	}

	if (!isset($controllersMap[$contrStr]))
		setLocation(BASEURL);

	// Check correct user authentication for controller
	$loggedOutControllers = array("user/login", "user/register");
	$isLogOutCont = in_array($contrStr."/".$routeParts[0], $loggedOutControllers);


	$contClass = $controllersMap[$contrStr];

	$controller = new $contClass();

	// Prepare action
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

	$controller->authRequired = !$isLogOutCont;

	if ($controller instanceof ApiController)
	{
		$controller->initAPI();
	}

	wlog("Controller class: ".$contClass);
	wlog("Action: ".$action);

	if (method_exists($controller, $action))
		$controller->$action();
