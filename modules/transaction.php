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

	if (!isset($_GET["type"]))
		fail();
	if ($_GET["type"] == "expense")
		$trans_type = 1;
	else if ($_GET["type"] == "income")
		$trans_type = 2;
	else if ($_GET["type"] == "transfer")
		$trans_type = 3;
	else
		fail();

	$src_id = (isset($_POST["srcid"])) ? intval($_POST["srcid"]) : 0;
	$dest_id = (isset($_POST["destid"])) ? intval($_POST["destid"]) : 0;
	$amount = floatval($_POST["amount"]);
	$charge = floatval($_POST["charge"]);
	$transcurr = (isset($_POST["transcurr"])) ? intval($_POST["transcurr"]) : 0;
	$trdate = strtotime($_POST["date"]);
	$fdate = date("Y-m-d H:i:s", $trdate);
	$comment = $db->escape($_POST["comm"]);

	if ($trans_type == 1 && (!$src_id || !$transcurr))
		fail();
	if ($trans_type == 2 && (!$dest_id || !$transcurr))
		fail();
	if ($trans_type == 3 && (!$src_id || !$dest_id))
		fail();
	if ($amount == 0.0 || $charge == 0.0 || $trdate == -1)
		fail();

	$trans = new Transaction($userid);
	if (!$trans->create($trans_type, $src_id, $dest_id, $amount, $charge, $transcurr, $fdate, $comment))
		fail();

	setLocation("../index.php?trans=ok");
?>