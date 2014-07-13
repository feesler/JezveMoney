<?php
	require_once("./setup.php");

	checkUser(FALSE);

	$titleString = "Jezve Money | Log in";

	$cssArr = array("common.css", "user.css", "iconlink.css");
	$jsArr = array("common.js", "ready.js", "main.js");

	include("./templates/login.tpl");
?>