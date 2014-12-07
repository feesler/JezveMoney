<?php
	require_once("../system/setup.php");


	$u = new User();
	$user_id = $u->check();
	if (!$user_id || !$u->isAdmin($user_id))
		setLocation("../login.php");

	$currArr = Currency::getArray(TRUE);

	include("./view/templates/currency.tpl");
?>