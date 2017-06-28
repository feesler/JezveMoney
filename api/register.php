<?php
	require_once("../system/setup.php");


	$respObj = new apiResponse();

	$uMod = new UserModel();
	$user_id = $uMod->check();
	if ($user_id != 0)		// need to log out first
		$respObj->fail();

	if (!isset($_POST["login"]) || !isset($_POST["password"]) || !isset($_POST["name"]))
		$respObj->fail();

	if (!$uMod->register($_POST["login"], $_POST["password"], $_POST["name"]))
		$respObj->fail();


	$respObj->ok();
