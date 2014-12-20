<?php
	require_once("./system/setup.php");

wlog("route: ".$route);

	$route = trim($route, "/\\");
	$routeParts = explode("/", $route);

foreach($routeParts as $ind => $rpart)
	wlog($ind." => ".$rpart);


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
							"register" => $userCont);

	$actionsMap = array("new" => "create",
						"edit" => "update");

	// Prepare controller
	$contrStr = array_shift($routeParts);
	if (!$contrStr)
		$contrStr = "index";

wlog("contrStr: ".$contrStr);

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

	if (method_exists($controller, $action))
		$controller->$action();


/*
	if ($contrStr == "accounts")
	{
		$controller = new AccountsController();

		if ($action == "new")
			$controller->create();
		else if ($action == "edit")
		{
			$_GET["id"] = $routeParts[2];
			$controller->update();
		}
		else if ($action == "del")
		{
			$controller->del();
		}
		else if ($action == "reset")
		{
			$controller->reset();
		}
		else if (!is_null($action))
			setLocation(BASEURL."accounts/");
	}
	else if ($contrStr == "persons")
	{
		$controller = new PersonsController();

		if ($action == "new")
			$controller->create();
		else if ($action == "edit")
		{
			$_GET["id"] = $routeParts[2];
			$controller->update();
		}
		else if ($action == "del")
		{
			$controller->del();
		}
		else if (!is_null($action))
			setLocation(BASEURL."persons/");
	}
	else if ($contrStr == "transactions")
	{
		$controller = new TransactionsController();

		if ($action == "new")
			$controller->create();
		else if ($action == "edit")
		{
			$_GET["id"] = $routeParts[2];
			$controller->update();
		}
		else if ($action == "del")
		{
			$controller->del();
		}
		else if (!is_null($action))
			setLocation(BASEURL."transactions/");
	}
	else if ($contrStr == "profile")
	{
		$controller = new ProfileController();

		$controller->action = $action;

		if ($action == "changename")
			$controller->changeName();
		else if ($action == "changepass")
		{
			$controller->changePass();
		}
		else if ($action == "resetall")
		{
			$controller->resetAll();
		}
		else if (!is_null($action))
			setLocation(BASEURL.$contrStr."/");
	}
	else if ($contrStr == "statistics")
	{
		$controller = new StatisticsController();

		if (!is_null($action))
			setLocation(BASEURL.$contrStr."/");
	}
	else if ($contrStr == "login" || $contrStr == "logout" || $contrStr == "register")
	{
		$controller = new UserController();

		$controller->$contrStr();
	}

	if (is_null($controller))
		$controller = new MainController();

wlog("action: ".(is_null($action) ? "NULL" : $action));

	if (is_null($action))
		$controller->index();
*/
