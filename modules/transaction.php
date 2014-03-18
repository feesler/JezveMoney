<?php
	require_once("../setup.php");


	function fail()
	{
		setMessage(ERR_TRANS_CREATE);
		setLocation("../index.php");
	}


	$user_id = User::check();
	if (!$user_id)
		setLocation("../login.php");

	if (!isset($_GET["type"]))
		fail();
	$trans_type = Transaction::getStringType($_GET["type"]);
	if (!$trans_type)
		fail();

	$src_id = (isset($_POST["src_id"])) ? intval($_POST["src_id"]) : 0;
	$dest_id = (isset($_POST["dest_id"])) ? intval($_POST["dest_id"]) : 0;
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

	$trans = new Transaction($user_id);
	if (!$trans->create($trans_type, $src_id, $dest_id, $amount, $charge, $transcurr, $fdate, $comment))
		fail();

	setMessage(MSG_TRANS_CREATE);
	setLocation("../index.php");
?>