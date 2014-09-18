<?php
	require_once("../setup.php");


	$respObj = new apiResponse();

	$u = new User();
	$user_id = $u->check();
	if ($user_id != 0)		// need to log out first
		$respObj->fail();

	if (!isset($_POST["login"]) || !isset($_POST["password"]) || !isset($_POST["name"]))
		$respObj->fail();

	if (!$u->register($_POST["login"], $_POST["password"], $_POST["name"]))
		$respObj->fail();


	$respObj->ok();
?>