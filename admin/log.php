<?php
	$noLogs = TRUE;
	require_once("../system/setup.php");
	require_once("../system/admin.php");

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

	$menuItems["log"]["active"] = TRUE;

	$titleString = "Admin panel | Log";

	$cssMainArr = array("common.css", "iconlink.css", "app.css");
	$cssLocalArr = array("admin.css");
	$jsMainArr = array("es5-shim.min.js", "common.js", "app.js");
	$jsLocalArr = array();

	include("./view/templates/log.tpl");
