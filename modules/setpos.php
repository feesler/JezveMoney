<?php
	require_once("../setup.php");


	function fail($acc_id)
	{
		echo("fail");
		exit();
	}


	$user_id = User::check();
	if (!$user_id)
		echo("fail");

	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]) ||
		!isset($_GET["pos"]) || !is_numeric($_GET["pos"]))
		fail();

	$tr_id = intval($_GET["id"]);
	$to_pos = intval($_GET["pos"]);
	if (!$tr_id || !$to_pos)
		fail();

	$trans = new Transaction($user_id);
	if (!$trans->updatePos($tr_id, $to_pos))
		fail();

	echo("ok");
?>