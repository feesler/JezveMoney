<?php
	require_once("../setup.php");

	class apiResponse
	{
		public $result;


		public function render()
		{
			return f_json_encode($this);
		}
	}


	function fail()
	{
		global $respObj;

		$respObj->result = "fail";

		echo($respObj->render());
		exit();
	}


	function ok()
	{
		global $respObj;

		$respObj->result = "ok";

		echo($respObj->render());
		exit();
	}


	$respObj = new apiResponse();

	$u = new User();
	$user_id = $u->check();
	if ($user_id == 0)
		fail();

	if (isset($_GET["act"]))
		$action = $_GET["act"];
	if ($action != "new" && $action != "edit" && $action != "del")
		fail();

	if ($action == "new" || $action == "edit")
	{
		$trans_type = intval($_POST["transtype"]);

		if ($trans_type == 4)
		{
			$debt_op = (isset($_POST["debtop"])) ? intval($_POST["debtop"]) : 0;
			$person_id = (isset($_POST["person_id"])) ? intval($_POST["person_id"]) : 0;
			$acc_id = (isset($_POST["acc_id"])) ? intval($_POST["acc_id"]) : 0;

			if (($debt_op != 1 && $debt_op != 2) || !$person_id)
				fail();

			$pers = new Person($user_id);
			if (!$pers->is_exist($person_id))		// person should exist
				fail();

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
			fail();
	}

	$trans = new Transaction($user_id);
	if ($action == "new")
	{
		if ($trans_type == 4)
		{
			if (!$debt->create($debt_op, $acc_id, $person_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment))
				fail();
		}
		else
		{
			if ($trans_type == 1 && (!$src_id || !$src_curr || !$dest_curr))
				fail();
			if ($trans_type == 2 && (!$dest_id || !$src_curr || !$dest_curr))
				fail();
			if ($trans_type == 3 && (!$src_id || !$dest_id || !$src_curr || !$dest_id))
				fail();

			$trans_id = $trans->create($trans_type, $src_id, $dest_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment);
			if (!$trans_id)
				fail();

			$respObj->data = array("id" => $trans_id);
		}
	}
	else if ($action == "edit")
	{
		if (!isset($_POST["transid"]))
			fail();
		$trans_id = intval($_POST["transid"]);
		if (!$trans_id)
			fail();
		if ($trans_type == 4)
		{
			if (!$debt->edit($trans_id, $debt_op, $acc_id, $person_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment))
				fail();
		}
		else
		{
			if (!$trans->edit($trans_id, $trans_type, $src_id, $dest_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment))
				fail();
		}
		$ttStr = Transaction::getTypeString($trans_type);
		if (is_null($ttStr))
			fail();
	}
	else if ($action == "del")
	{
		if (!isset($_POST["transactions"]))
			fail();
		$trans_list = $db->escape($_POST["transactions"]);
		if (is_empty($trans_list))
			fail();
		$trans_arr = explode(",", $trans_list);
		foreach($trans_arr as $trans_id)
		{
			$trans_id = intval($trans_id);
			if (!$trans->del($trans_id))
				fail();
		}

	}

	ok();
?>