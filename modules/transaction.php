<?php
	require_once("../setup.php");


	function fail($msg = NULL)
	{
		if (!is_null($msg))
			setMessage($msg);
		setLocation("../index.php");
	}


	checkUser();

	if (isset($_GET["act"]))
		$action = $_GET["act"];
	if ($action != "new" && $action != "edit" && $action != "del")
		fail();

	if ($action == "new")
	{
		if (!isset($_GET["type"]))
			fail();
		$trans_type = Transaction::getStringType($_GET["type"]);
		if (!$trans_type)
			fail();
	}
	else if ($action == "edit")
	{
		$trans_type = intval($_POST["transtype"]);
	}

	if ($action == "new")
		$defMsg = ($trans_type == 4) ? ERR_DEBT_CREATE : ERR_TRANS_CREATE;
	else if ($action == "edit")
		$defMsg = ($trans_type == 4) ? ERR_DEBT_UPDATE : ERR_TRANS_UPDATE;
	else if ($action == "del")
		$defMsg = ERR_TRANS_DELETE;

	if ($action == "new" || $action == "edit")
	{
		if ($trans_type == 4)
		{
			$debt_op = (isset($_POST["debtop"])) ? intval($_POST["debtop"]) : 0;
			$person_id = (isset($_POST["person_id"])) ? intval($_POST["person_id"]) : 0;
			$acc_id = (isset($_POST["acc_id"])) ? intval($_POST["acc_id"]) : 0;

			if (($debt_op != 1 && $debt_op != 2) || !$person_id)
				fail($defMsg);

			$pers = new Person($user_id);
			if (!$pers->is_exist($person_id))		// person should exist
				fail($defMsg);

			$debt = new Debt($user_id);
		}
		else
		{
			$src_id = (isset($_POST["src_id"])) ? intval($_POST["src_id"]) : 0;
			$dest_id = (isset($_POST["dest_id"])) ? intval($_POST["dest_id"]) : 0;
		}
		$src_amount = floatval($_POST["src_amount"]);
		$dest_amount = floatval($_POST["dest_amount"]);
		$src_curr = (isset($_POST["src_curr"])) ? intval($_POST["src_curr"]) : 0;
		$dest_curr = (isset($_POST["dest_curr"])) ? intval($_POST["dest_curr"]) : 0;
		$trdate = strtotime($_POST["date"]);
		$fdate = date("Y-m-d H:i:s", $trdate);
		$comment = $db->escape($_POST["comm"]);

		if ($src_amount == 0.0 || $dest_amount == 0.0 || $trdate == -1)
			fail($defMsg);
	}

	$trans = new Transaction($user_id);
	if ($action == "new")
	{
		if ($trans_type == 4)
		{
			if (!$debt->create($debt_op, $acc_id, $person_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment))
				fail($defMsg);
			setMessage(MSG_DEBT_CREATE);
			setLocation("../transactions.php?type=debt");
		}
		else
		{
			if ($trans_type == 1 && (!$src_id || !$src_curr || !$dest_curr))
				fail($defMsg);
			if ($trans_type == 2 && (!$dest_id || !$src_curr || !$dest_curr))
				fail($defMsg);
			if ($trans_type == 3 && (!$src_id || !$dest_id || !$src_curr || !$dest_id))
				fail($defMsg);

			if (!$trans->create($trans_type, $src_id, $dest_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment))
				fail($defMsg);
			setMessage(MSG_TRANS_CREATE);
			setLocation("../index.php");
		}
	}
	else if ($action == "edit")
	{
		if (!isset($_POST["transid"]))
			fail($defMsg);
		$trans_id = intval($_POST["transid"]);
		if ($trans_type == 4)
		{
			if (!$debt->edit($trans_id, $debt_op, $acc_id, $person_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment))
				fail($defMsg);
			setMessage(MSG_DEBT_UPDATE);
		}
		else
		{
			if (!$trans->edit($trans_id, $trans_type, $src_id, $dest_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment))
				fail($defMsg);
		}
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