<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");
	require_once("../class/transaction.php");


	function fail()
	{
		setLocation("../index.php?trans=fail");
	}


	$userid = User::check();
	if (!$userid)
		setLocation("../login.php");

	$src_id = intval($_POST["srcid"]);
	$dest_id = intval($_POST["destid"]);
	$amount = floatval($_POST["amount"]);
	$charge = floatval($_POST["charge"]);
	$trdate = strtotime($_POST["date"]);
	$fdate = date("Y-m-d H:i:s", $trdate);
	$comment = $db->escape($_POST["comm"]);

	if (!$src_id || !$dest_id || $amount == 0.0 || $charge == 0.0 || $trdate == -1)
		fail();

	$trans = new Transaction($userid);
	if (!$trans->create(3, $src_id, $dest_id, $amount, $charge, $transcurr, $fdate, $comment))
		fail();

	setLocation("../index.php?trans=ok");
?>