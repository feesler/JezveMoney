<?php
	require_once("./setup.php");


	$u = new User();
	$user_id = $u->check();
	if ($user_id != 0)
		setLocation("./index.php");

	$titleString = "Jezve Money | Registration";

	$cssArr = array("common.css", "user.css", "iconlink.css");
	$jsArr = array("common.js", "ready.js", "main.js");

	include("./templates/register.tpl");
?>