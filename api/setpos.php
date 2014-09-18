<?php
	require_once("../setup.php");


	$respObj = new apiResponse();

	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		$respObj->fail();

	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]) ||
		!isset($_GET["pos"]) || !is_numeric($_GET["pos"]))
		$respObj->fail();

	$tr_id = intval($_GET["id"]);
	$to_pos = intval($_GET["pos"]);
	if (!$tr_id || !$to_pos)
		$respObj->fail();

	$trans = new Transaction($user_id);
	if (!$trans->updatePos($tr_id, $to_pos))
		$respObj->fail();

	$respObj->ok();
?>