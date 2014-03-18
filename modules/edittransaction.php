﻿<?php
	require_once("../setup.php");


	function fail()
	{
		setMessage(ERR_TRANS_UPDATE);
		setLocation("../transactions.php");
	}


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("../login.php");

	$trans_id = intval($_POST["transid"]);
	$trans_type = intval($_POST["transtype"]);
	$src_id = intval($_POST["src_id"]);
	$dest_id = intval($_POST["dest_id"]);
	$amount = floatval($_POST["amount"]);
	$charge = floatval($_POST["charge"]);
	$transcurr = intval($_POST["transcurr"]);
	$trdate = strtotime($_POST["date"]);
	$fdate = date("Y-m-d H:i:s", $trdate);
	$comment = $db->escape($_POST["comm"]);


	$trans = new Transaction($user_id);
	if (!$trans->edit($trans_id, $trans_type, $src_id, $dest_id, $amount, $charge, $transcurr, $fdate, $comment))
		fail();

	$ttStr = Transaction::getTypeString($trans_type);
	if (is_null($ttStr))
		fail();

	setMessage(MSG_TRANS_UPDATE);
	setLocation("../transactions.php?type=".$ttStr);
?>