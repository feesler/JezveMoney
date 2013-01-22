<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");
	require_once("../class/transaction.php");


	function fail()
	{
		setLocation("../transactions.php?edit=fail");
	}


	$userid = User::check();
	if (!$userid)
		setLocation("../login.php");

	$trans_id = intval($_POST["transid"]);
	$trans_type = intval($_POST["transtype"]);
	$src_id = intval($_POST["srcid"]);
	$dest_id = intval($_POST["destid"]);
	$amount = floatval($_POST["amount"]);
	$charge = floatval($_POST["charge"]);
	$transcurr = intval($_POST["transcurr"]);
	$trdate = strtotime($_POST["date"]);
	$fdate = date("Y-m-d H:i:s", $trdate);
	$comment = $db->escape($_POST["comm"]);


	$trans = new Transaction($userid);
	if (!$trans->edit($trans_id, $trans_type, $src_id, $dest_id, $amount, $charge, $transcurr, $fdate, $comment))
		fail();

	$ttStr = Transaction::getTypeString($trans_type);
	if (is_null($ttStr))
		fail();

	setLocation("../transactions.php?type=".$ttStr."&edit=ok");
?>