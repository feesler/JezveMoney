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
	$amount = floatval($_POST["amount"]);
	$charge = floatval($_POST["charge"]);
	$transcurr = intval($_POST["transcurr"]);
	$trdate = strtotime($_POST["date"]);
	$fdate = date("Y-m-d H:i:s", $trdate);
	$comment = $db->escape($_POST["comm"]);

	if (!$src_id || $amount == 0.0 || $charge == 0.0 || $trdate == -1)
		fail();

	$trans = new Transaction($userid);
	if (!$trans->create(1, $src_id, 0, $amount, $charge, $transcurr, $fdate, $comment))
		fail();

	setLocation("../index.php?spend=ok");
?>