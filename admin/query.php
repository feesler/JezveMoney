<?php
	require_once("../system/setup.php");

	$u = new User();
	$user_id = $u->check();
	if (!$user_id || !$u->isAdmin($user_id))
		setLocation("../login.php");


	$query = NULL;
	if (isset($_POST["query"]) && $_POST["query"] != "")
	{
		$query = $_POST["query"];

		if (isset($_POST["qtype"]) && $_POST["qtype"] == "1")		// select query
		{
			$resArr = array();
			$result = $db->rawQ($query);
			$qerr_num = mysql_errno();
			$qerror = mysql_error();
			if ($result && !$qerr_num && mysql_num_rows($result) > 0)
			{
				while($row = mysql_fetch_array($result, MYSQL_ASSOC))
					$resArr[] = $row;

				$rows = count($resArr);
				$cols = isset($resArr[0]) ? count($resArr[0]) : 0;
			}
		}
	}


	$menuItems = array("curr" => array("title" => "Currencies", "link" => "./currency.php"),
					"query" => array("title" => "Queries", "link" => "./query.php"),
					"log" => array("title" => "Logs", "link" => "./log.php"),
					"apitest" => array("title" => "API test", "link" => "./apitest.php"));

	$menuItems["query"]["active"] = TRUE;

	$titleString = "Admin panel | DB queries";

	$cssMainArr = array("common.css", "iconlink.css");
	$cssLocalArr = array("admin.css", "query.css");
	$jsMainArr = array("es5-shim.min.js", "common.js", "app.js");
	$jsLocalArr = array();

	include("./view/templates/query.tpl");
