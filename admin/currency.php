<?php
	require_once("../system/setup.php");


	$u = new User();
	$user_id = $u->check();
	if (!$user_id || !$u->isAdmin($user_id))
		setLocation("../login.php");

	$currArr = Currency::getArray(TRUE);

	$titleString = "Admin panel | Currency";

	$cssMainArr = array("common.css", "iconlink.css", "popup.css");
	$cssLocalArr = array("admin.css", "currency.css");
	$jsMainArr = array("es5-shim.min.js", "common.js", "app.js", "currency.js", "popup.js");
	$jsLocalArr = array("currency.js");

	include("./view/templates/currency.tpl");
?>