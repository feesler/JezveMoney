<?php
	require_once("../system/setup.php");
	require_once("../system/admin.php");

	checkUser(TRUE, TRUE);

	$controller = new UserAdminController();

	$actionsMap = array("new" => "create", "edit" => "update", "chpwd" => "changePassword", "del" => "del");

	$action = NULL;
	if (isset($_GET["act"]))
	{
		$actStr = $_GET["act"];
wlog("actStr: ".$actStr);
		if (isset($actionsMap[$actStr]))
			$action = $actionsMap[$_GET["act"]];
		else
			setLocation(BASEURL."admin/user.php");
	}

wlog("action: ".$action);

	$controller->initDefResources();

	if (!is_null($action) && method_exists($controller, $action))
		$controller->$action();
	else
		$controller->index();
