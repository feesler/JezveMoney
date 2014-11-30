<?php
	require_once("../system/setup.php");


	$respObj = new apiResponse();

	$u = new User();
	$user_id = $u->check();
	if ($user_id != 0)
		$respObj->ok();

	if (!isset($_GET["login"]) || !isset($_GET["pwd"]))
		$respObj->fail();

	if (!$u->login($_GET["login"], $_GET["pwd"]))
		$respObj->fail();

	$respObj->ok();
