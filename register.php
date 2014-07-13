<?php
	require_once("./setup.php");

	checkUser(FALSE);

	$titleString = "Jezve Money | Registration";

	$cssArr = array("common.css", "user.css", "iconlink.css");
	$jsArr = array("common.js", "ready.js", "main.js");

	include("./templates/register.tpl");
?>