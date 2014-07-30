<?php
	require_once("../setup.php");


	function fail($msg = NULL)
	{
		if (!is_null($msg))
			setMessage($msg);
		setLocation("../accounts.php");
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
		$defMsg = ERR_ACCOUNT_CREATE;
	else if ($action == "edit")
		$defMsg = ERR_ACCOUNT_UPDATE;
	else if ($action == "del")
		$defMsg = ERR_ACCOUNT_DELETE;

	if ($action == "new" || $action == "edit")
	{
		if (!isset($_POST["accname"]) || !isset($_POST["balance"]) || !isset($_POST["currency"]) || !isset($_POST["icon"]))
			fail($defMsg);
	}

	$acc = new Account($user_id);
	if ($action == "new")
	{
		$owner_id = $u->getOwner($user_id);
		if (!$acc->create($owner_id, $_POST["accname"], $_POST["balance"], $_POST["currency"], $_POST["icon"]))
			fail($defMsg);

		setMessage(MSG_ACCOUNT_CREATE);
	}
	else if ($action == "edit")
	{
		if (!isset($_POST["accid"]))
			fail($defMsg);

		if (!$acc->edit($_POST["accid"], $_POST["accname"], $_POST["balance"], $_POST["currency"], $_POST["icon"]))
			fail($defMsg);

		setMessage(MSG_ACCOUNT_UPDATE);
	}
	else if ($action == "del")
	{
		if (!isset($_POST["accounts"]))
			fail($defMsg);

		$acc_list = $db->escape($_POST["accounts"]);
		$acc_arr = explode(",", $acc_list);
		foreach($acc_arr as $acc_id)
		{
			$acc_id = intval($acc_id);
			if (!$acc->del($acc_id))
				fail($defMsg);
		}

		setMessage(MSG_ACCOUNT_DELETE);
	}

	setLocation("../accounts.php");
?>