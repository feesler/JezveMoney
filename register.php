<?php
	require_once("./system/setup.php");

	checkUser(FALSE);

	$titleString = "Jezve Money | Registration";

	$cssArr = array("common.css", "user.css", "iconlink.css");
	$jsArr = array("es5-shim.min.js", "common.js", "app.js", "main.js");

	include("./view/templates/register.tpl");
?>