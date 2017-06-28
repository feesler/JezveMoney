<?php
	require_once("../system/setup.php");


	$uMod = new UserModel();
	$user_id = $uMod->check();
	if (!$user_id || !$uMod->isAdmin($user_id))
		setLocation("../login.php");

	$menuItems = array("curr" => array("title" => "Currencies", "link" => "./currency.php"),
					"query" => array("title" => "Queries", "link" => "./query.php"),
					"log" => array("title" => "Logs", "link" => "./log.php"),
					"apitest" => array("title" => "API test", "link" => "./apitest.php"));

	$menuItems["apitest"]["active"] = TRUE;

	$titleString = "Admin panel | API test";

	$cssMainArr = array("common.css", "iconlink.css");
	$cssLocalArr = array("admin.css", "apitest.css");
	$jsMainArr = array("es5-shim.min.js", "common.js", "app.js", "ajax.js");
	$jsLocalArr = array("apitest.js");

	include("./view/templates/apitest.tpl");
