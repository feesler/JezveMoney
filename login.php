<?php
	require_once("./system/setup.php");

	checkUser(FALSE);

	$titleString = "Jezve Money | Log in";

	$cssArr = array("common.css", "user.css", "iconlink.css");
	$jsArr = array("es5-shim.min.js", "common.js", "app.js", "main.js");

	include("./view/templates/login.tpl");
?>