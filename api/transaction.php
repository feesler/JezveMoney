<?php
	require_once("../setup.php");


	$respObj = new apiResponse();

	$u = new User();
	$user_id = $u->check();
	if ($user_id == 0)
		$respObj->fail();

	if (isset($_GET["act"]))
		$action = $_GET["act"];
	if ($action != "list" && $action != "read" && $action != "new" && $action != "edit" && $action != "del" && $action != "setpos")
		$respObj->fail();

	if ($action == "new" || $action == "edit")
	{
		$trans_type = intval($_POST["transtype"]);

		if ($trans_type == 4)
		{
			$debt_op = (isset($_POST["debtop"])) ? intval($_POST["debtop"]) : 0;
			$person_id = (isset($_POST["person_id"])) ? intval($_POST["person_id"]) : 0;
			$acc_id = (isset($_POST["acc_id"])) ? intval($_POST["acc_id"]) : 0;

			if (($debt_op != 1 && $debt_op != 2) || !$person_id)
				$respObj->fail();

			$pers = new Person($user_id);
			if (!$pers->is_exist($person_id))		// person should exist
				$respObj->fail();

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
			$respObj->fail();
	}

	if ($action == "read" || $action == "edit")
	{
		if (!isset($_POST["transid"]))
			$respObj->fail();
		$trans_id = intval($_POST["transid"]);
		if (!$trans_id)
			$respObj->fail();
	}

	$trans = new Transaction($user_id);
	if ($action == "list")
	{
		$acc = new Account($user_id);

		$type_str = (isset($_GET["type"])) ? $_GET["type"] : "all";

		$trans_type = Transaction::getStringType($type_str);
		if (is_null($trans_type))
			$respObj->fail();

		$tr_on_page = (isset($_GET["count"]) && is_numeric($_GET["count"])) ? intval($_GET["count"]) : 10;

		$page_num = (isset($_GET["page"]) && is_numeric($_GET["page"])) ? (intval($_GET["page"]) - 1) : 0;

		$acc_id = (isset($_GET["acc_id"])) ? intval($_GET["acc_id"]) : 0;
		if ($acc_id && !$acc->is_exist($acc_id))
			$acc_id = 0;

		$searchReq = (isset($_GET["search"]) ? $_GET["search"] : NULL);

		$stDate = (isset($_GET["stdate"]) ? $_GET["stdate"] : NULL);
		$endDate = (isset($_GET["enddate"]) ? $_GET["enddate"] : NULL);

		$trArr = $trans->getArray($trans_type, $acc_id, TRUE, $tr_on_page, $page_num, $searchReq, $stDate, $endDate, FALSE);
		$respObj->data = array();
		foreach($trArr as $trans)
		{
			$tr = new apiObject;
			$tr->id = $trans[0];
			$tr->src_id = $trans[1];
			$tr->dest_id = $trans[2];
			$tr->src_amount = $trans[10];
			$tr->dest_amount = $trans[11];
			$tr->src_curr = $trans[12];
			$tr->dest_curr = $trans[13];
			$tr->date = $trans[6];
			$tr->comment = $trans[7];
			$tr->pos = $trans[8];

			$respObj->data[] = $tr;
		}
	}
	else if ($action == "read")
	{
		$props = $trans->getProperties($trans_id);
		if (is_null($props))
			$respObj->fail();

		$respObj->data = $props;
	}
	else if ($action == "new")
	{
		if ($trans_type == 4)
		{
			if (!$debt->create($debt_op, $acc_id, $person_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment))
				$respObj->fail();
		}
		else
		{
			if ($trans_type == 1 && (!$src_id || !$src_curr || !$dest_curr))
				$respObj->fail();
			if ($trans_type == 2 && (!$dest_id || !$src_curr || !$dest_curr))
				$respObj->fail();
			if ($trans_type == 3 && (!$src_id || !$dest_id || !$src_curr || !$dest_id))
				$respObj->fail();

			$trans_id = $trans->create($trans_type, $src_id, $dest_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment);
			if (!$trans_id)
				$respObj->fail();

			$respObj->data = array("id" => $trans_id);
		}
	}
	else if ($action == "edit")
	{
		if ($trans_type == 4)
		{
			if (!$debt->edit($trans_id, $debt_op, $acc_id, $person_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment))
				$respObj->fail();
		}
		else
		{
			if (!$trans->edit($trans_id, $trans_type, $src_id, $dest_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment))
				$respObj->fail();
		}
		$ttStr = Transaction::getTypeString($trans_type);
		if (is_null($ttStr))
			$respObj->fail();
	}
	else if ($action == "del")
	{
		if (!isset($_POST["transactions"]))
			$respObj->fail();
		$trans_list = $db->escape($_POST["transactions"]);
		if (is_empty($trans_list))
			$respObj->fail();
		$trans_arr = explode(",", $trans_list);
		foreach($trans_arr as $trans_id)
		{
			$trans_id = intval($trans_id);
			if (!$trans->del($trans_id))
				$respObj->fail();
		}

	}
	else if ($action == "setpos")
	{
		if (!isset($_POST["id"]) || !is_numeric($_POST["id"]) ||
			!isset($_POST["pos"]) || !is_numeric($_POST["pos"]))
			$respObj->fail();

		$tr_id = intval($_POST["id"]);
		$to_pos = intval($_POST["pos"]);
		if (!$tr_id || !$to_pos)
			$respObj->fail();

		$trans = new Transaction($user_id);
		if (!$trans->updatePos($tr_id, $to_pos))
			$respObj->fail();
	}

	$respObj->ok();
?>