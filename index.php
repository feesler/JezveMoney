<?php
	require_once("./system/setup.php");

	checkUser();

	if (isset($_GET["route"]))
		$route = $_GET["route"];

wlog("route: ".$route);

	$routeParts = explode("/", $route);

	$controller = NULL;
	$action = NULL;

foreach($routeParts as $ind => $rpart)
	wlog($ind." => ".$rpart);

	if (count($routeParts) > 1)
	{
		if ($routeParts[0] == "accounts")
		{
			$controller = new AccountsController();

			if (isset($routeParts[1]) && $routeParts[1] != "")
				$action = $routeParts[1];

			if ($action == "new")
				$controller->create();
			else if ($action == "edit")
			{
				$_GET["id"] = $routeParts[2];
				$controller->update();
			}
		}
	}

	if (is_null($controller))
		$controller = new MainController();

wlog("action: ".(is_null($action) ? "NULL" : $action));

	if (is_null($action))
		$controller->index();
