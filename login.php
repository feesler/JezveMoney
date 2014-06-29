<?php
	require_once("./setup.php");


	$u = new User();
	$user_id = $u->check();
	if ($user_id != 0)
		setLocation("./index.php");

	$titleString = "Jezve Money | Log in";

	$cssArr = array("common.css", "user.css", "iconlink.css");
	$jsArr = array("common.js", "ready.js", "main.js");

	include("./templates/login.tpl");
?>