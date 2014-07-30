<?php
	require_once("../setup.php");


	function fail($msg = NULL)
	{
		if (!is_null($msg))
			setMessage($msg);
		setLocation("../index.php");
	}


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("../login.php");

	if (isset($_GET["act"]))
		$action = $_GET["act"];
	if ($action != "new" && $action != "edit" && $action != "del")
		fail();

	if ($action == "new")
		$defMsg = ERR_TRANS_CREATE;
	else if ($action == "edit")
		$defMsg = ERR_TRANS_UPDATE;
	else if ($action == "del")
		$defMsg = ERR_TRANS_DELETE;

	if ($action == "new")
	{
		if (!isset($_GET["type"]))
			fail($defMsg);
		$trans_type = Transaction::getStringType($_GET["type"]);
		if (!$trans_type)
			fail($defMsg);
	}
	else if ($action == "edit")
	{
		$trans_type = intval($_POST["transtype"]);
	}

	if ($action == "new" || $action == "edit")
	{
		$src_id = (isset($_POST["src_id"])) ? intval($_POST["src_id"]) : 0;
		$dest_id = (isset($_POST["dest_id"])) ? intval($_POST["dest_id"]) : 0;
		$amount = floatval($_POST["amount"]);
		$charge = floatval($_POST["charge"]);
		$transcurr = (isset($_POST["transcurr"])) ? intval($_POST["transcurr"]) : 0;
		$trdate = strtotime($_POST["date"]);
		$fdate = date("Y-m-d H:i:s", $trdate);
		$comment = $db->escape($_POST["comm"]);
	}

	$trans = new Transaction($user_id);
	if ($action == "new")
	{
		if ($trans_type == 1 && (!$src_id || !$transcurr))
			fail($defMsg);
		if ($trans_type == 2 && (!$dest_id || !$transcurr))
			fail($defMsg);
		if ($trans_type == 3 && (!$src_id || !$dest_id))
			fail($defMsg);
		if ($amount == 0.0 || $charge == 0.0 || $trdate == -1)
			fail($defMsg);

		if (!$trans->create($trans_type, $src_id, $dest_id, $amount, $charge, $transcurr, $fdate, $comment))
			fail($defMsg);
		setMessage(MSG_TRANS_CREATE);
		setLocation("../index.php");
	}
	else if ($action == "edit")
	{
		if (!isset($_POST["transid"]))
			fail($defMsg);
		$trans_id = intval($_POST["transid"]);
		if (!$trans->edit($trans_id, $trans_type, $src_id, $dest_id, $amount, $charge, $transcurr, $fdate, $comment))
			fail($defMsg);

		$ttStr = Transaction::getTypeString($trans_type);
		if (is_null($ttStr))
			fail($defMsg);

		setMessage(MSG_TRANS_UPDATE);
		setLocation("../transactions.php?type=".$ttStr);
	}
	else if ($action == "del")
	{
		if (!isset($_POST["transactions"]))
			fail($defMsg);
		$trans_list = $db->escape($_POST["transactions"]);
		if (is_empty($trans_list))
			fail($defMsg);
		$trans_arr = explode(",", $trans_list);
		foreach($trans_arr as $trans_id)
		{
			$trans_id = intval($trans_id);
			if (!$trans->del($trans_id))
				fail();
		}

		setMessage(MSG_TRANS_DELETE);
		setLocation("../transactions.php");
	}
?>