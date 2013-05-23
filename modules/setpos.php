<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");
	require_once("../class/transaction.php");


	function fail($acc_id)
	{
		setLocation("../checkbalance.php?id=".$acc_id."&pos=fail");
	}


	$userid = User::check();
	if (!$userid)
		setLocation("../login.php");

	if (!isset($_POST["trans_id"]) || !is_numeric($_POST["trans_id"]) ||
		!isset($_POST["trans_pos"]) || !is_numeric($_POST["trans_pos"]) ||
		!isset($_POST["trans_acc"]) || !is_numeric($_POST["trans_acc"]))
		fail();

	$tr_id = intval($_POST["trans_id"]);
	$to_pos = intval($_POST["trans_pos"]);
	$acc_id = intval($_POST["trans_acc"]);
	if ($acc_id == 0)
		$acc_id = "all";
	if (!$tr_id || !$to_pos)
		fail($acc_id);

	$trans = new Transaction($userid);
	if (!$trans->updatePos($tr_id, $to_pos))
		fail($acc_id);

	setLocation("../checkbalance.php?id=".$acc_id."&pos=ok");
?>