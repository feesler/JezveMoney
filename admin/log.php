<?php
	$noLogs = TRUE;
	require_once("../system/setup.php");

	$filename = $approot."admin/log.txt";

	$contents = "";
	if (file_exists($filename))
	{
		$fp = fopen($filename, "r");
		if ($fp)
		{
			$contents = fread($fp, filesize($filename));
			fclose($fp);
		}
	}

	$menuItems = array("curr" => array("title" => "Currencies", "link" => "./currency.php"),
					"query" => array("title" => "Queries", "link" => "./query.php"),
					"log" => array("title" => "Logs", "link" => "./log.php"),
					"apitest" => array("title" => "API test", "link" => "./apitest.php"));

	$menuItems["log"]["active"] = TRUE;

	$titleString = "Admin panel | Log";

	$cssMainArr = array("common.css", "iconlink.css");
	$cssLocalArr = array("admin.css");
	$jsMainArr = array("es5-shim.min.js", "common.js", "app.js");
	$jsLocalArr = array();

	include("./view/templates/log.tpl");
?>
