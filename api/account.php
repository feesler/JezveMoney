<?php
	require_once("../setup.php");


	$respObj = new apiResponse();

	$u = new User();
	$user_id = $u->check();
	if ($user_id == 0)
		$respObj->fail();

	if (isset($_GET["act"]))
		$action = $_GET["act"];
	if ($action != "list" && $action != "read" && $action != "new" && $action != "edit" && $action != "del" && $action != "reset")
		$respObj->fail();

	if ($action == "new" || $action == "edit")
	{
		if (!isset($_POST["accname"]) || !isset($_POST["balance"]) || !isset($_POST["currency"]) || !isset($_POST["icon"]))
			$respObj->fail();
	}

	if ($action == "read" || $action == "edit")
	{
		if (!isset($_POST["accid"]))
			$respObj->fail();
		$acc_id = intval($_POST["accid"]);
		if (!$acc_id)
			$respObj->fail();
	}

	$acc = new Account($user_id);
	if ($action == "list")
	{
		$accArr = $acc->getArray();
		$respObj->data = array();
		foreach($accArr as $account)
		{
			$accObj = new apiObject;
			$accObj->id = $account[0];
			$accObj->curr_id = $account[1];
			$accObj->balance = $account[3];
			$accObj->name = $account[4];
			$accObj->icon = $account[5];

			$respObj->data[] = $accObj;
		}
	}
	else if ($action == "read")
	{
		$props = $acc->getProperties($acc_id);
		if (is_null($props))
			$respObj->fail();

		$respObj->data = $props;
	}
	else if ($action == "new")
	{
		$owner_id = $u->getOwner($user_id);
		$acc_id = $acc->create($owner_id, $_POST["accname"], $_POST["balance"], $_POST["currency"], $_POST["icon"]);
		if (!$acc_id)
			$respObj->fail();

		$respObj->data = array("id" => $acc_id);
	}
	else if ($action == "edit")
	{
		if (!$acc->edit($acc_id, $_POST["accname"], $_POST["balance"], $_POST["currency"], $_POST["icon"]))
			$respObj->fail();
	}
	else if ($action == "del")
	{
		if (!isset($_POST["accounts"]))
			$respObj->fail();

		$acc_list = $db->escape($_POST["accounts"]);
		$acc_arr = explode(",", $acc_list);
		foreach($acc_arr as $acc_id)
		{
			$acc_id = intval($acc_id);
			if (!$acc->del($acc_id))
				$respObj->fail();
		}
	}
	else if ($action == "reset")
	{
		if (!$acc->reset())
			$respObj->fail();
	}

	$respObj->ok();
?>