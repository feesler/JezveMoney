<?php
	require_once("../system/setup.php");


	$respObj = new apiResponse();

	$uMod = new UserModel();
	$user_id = $uMod->check();
	if ($user_id == 0)
		$respObj->fail();

	if (isset($_GET["act"]))
		$action = $_GET["act"];

	$availActions = array("list", "read", "new", "edit", "del", "reset");
	if (!in_array($action, $availActions))
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

	$accMod = new AccountModel($user_id);
	if ($action == "list")
	{
		$respObj->data = $accMod->getArray();
	}
	else if ($action == "read")
	{
		$props = $accMod->getProperties($acc_id);
		if (is_null($props))
			$respObj->fail();

		$respObj->data = $props;
	}
	else if ($action == "new")
	{
		$owner_id = $uMod->getOwner($user_id);
		$acc_id = $accMod->create($owner_id, $_POST["accname"], $_POST["balance"], $_POST["currency"], $_POST["icon"]);
		if (!$acc_id)
			$respObj->fail();

		$respObj->data = array("id" => $acc_id);
	}
	else if ($action == "edit")
	{
		if (!$accMod->edit($acc_id, $_POST["accname"], $_POST["balance"], $_POST["currency"], $_POST["icon"]))
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
			if (!$accMod->del($acc_id))
				$respObj->fail();
		}
	}
	else if ($action == "reset")
	{
		if (!$accMod->reset())
			$respObj->fail();
	}

	$respObj->ok();
