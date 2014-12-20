<?php
	require_once("./system/setup.php");

	if (isset($_GET["route"]))
		$route = $_GET["route"];

wlog("route: ".$route);

	$routeParts = explode("/", $route);

	$controller = NULL;
	$action = NULL;

foreach($routeParts as $ind => $rpart)
	wlog($ind." => ".$rpart);

	$loggedOutControllers = array("login", "register");

	$contrStr = (count($routeParts) > 0 && $routeParts[0] != "") ? $routeParts[0] : NULL;

	$isLogOutCont = in_array($contrStr, $loggedOutControllers);

	checkUser(!$isLogOutCont);

	if ($contrStr == "accounts")
	{
		$controller = new AccountsController();

		if (count($routeParts) > 1 && isset($routeParts[1]) && $routeParts[1] != "")
		{
			$action = $routeParts[1];

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
			else
				setLocation(BASEURL."accounts/");
		}
	}
	else if ($contrStr == "persons")
	{
		$controller = new PersonsController();

		if (count($routeParts) > 1 && isset($routeParts[1]) && $routeParts[1] != "")
		{
			$action = $routeParts[1];

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
			else
				setLocation(BASEURL."persons/");
		}
	}
	else if ($contrStr == "transactions")
	{
		$controller = new TransactionsController();

		if (count($routeParts) > 1 && isset($routeParts[1]) && $routeParts[1] != "")
		{
			$action = $routeParts[1];

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
			else
				setLocation(BASEURL."transactions/");
		}
	}

	if (is_null($controller))
		$controller = new MainController();

wlog("action: ".(is_null($action) ? "NULL" : $action));

	if (is_null($action))
		$controller->index();
