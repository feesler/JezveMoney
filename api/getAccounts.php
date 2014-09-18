<?php
	require_once("../setup.php");


	$respObj = new apiResponse();

	$u = new User();
	$user_id = $u->check();
	if ($user_id == 0)
		$respObj->fail();

	$acc = new Account($user_id);
	$respObj->data = $acc->getArray();

	$respObj->ok();
?>