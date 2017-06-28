<?php
	require_once("../system/setup.php");


	$respObj = new apiResponse();

	$uMod = new UserModel();
	$user_id = $uMod->check();
	if ($user_id != 0)
		$respObj->ok();

	if (!isset($_GET["login"]) || !isset($_GET["pwd"]))
		$respObj->fail();

	if (!$uMod->login($_GET["login"], $_GET["pwd"]))
		$respObj->fail();

	$respObj->ok();
