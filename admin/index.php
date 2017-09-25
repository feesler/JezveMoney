<?php
	require_once("../system/setup.php");
	require_once("../system/admin.php");

	$uMod = new UserModel();
	$user_id = $uMod->check();
	if (!$user_id || !$uMod->isAdmin($user_id))
		setLocation("../login.php");

	$titleString = "Admin panel";

	$cssMainArr = array("common.css", "app.css");
	$cssLocalArr = array("admin.css");
	$jsMainArr = array();
	$jsLocalArr = array();

	include("./view/templates/index.tpl");
