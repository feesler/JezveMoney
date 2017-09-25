<?php
	require_once("../system/setup.php");
	require_once("../system/admin.php");

	$menuItems["apitest"]["active"] = TRUE;

	$titleString = "Admin panel | API test";

	$cssMainArr = array("common.css", "iconlink.css", "app.css");
	$cssLocalArr = array("admin.css", "apitest.css");
	$jsMainArr = array("es5-shim.min.js", "common.js", "app.js", "ajax.js");
	$jsLocalArr = array("apitest.js");

	include("./view/templates/apitest.tpl");
