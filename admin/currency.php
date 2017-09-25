<?php
	require_once("../system/setup.php");
	require_once("../system/admin.php");

	$controller = new CurrencyController();

	$actionsMap = array("new" => "create", "edit" => "update", "del" => "del");

	$action = NULL;
	if (isset($_GET["act"]))
	{
		$actStr = $_GET["act"];

		if (isset($actionsMap[$actStr]))
			$action = $actionsMap[$_GET["act"]];
		else
			setLocation(BASEURL."admin/currency.php");
	}

	if (is_null($action))
		$controller->index();
	else
		$controller->$action();
