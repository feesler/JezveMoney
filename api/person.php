<?php
	require_once("../system/setup.php");


	$respObj = new apiResponse();

	$uMod = new UserModel();
	$user_id = $uMod->check();
	if ($user_id == 0)
		$respObj->fail();

	if (isset($_GET["act"]))
		$action = $_GET["act"];

	$availActions = array("list", "read", "new", "edit", "del");
	if (!in_array($action, $availActions))
		$respObj->fail();

	$personMod = new PersonModel($user_id);
	if ($action == "new" || $action == "edit")
	{
		if (!isset($_POST["pname"]))
			$respObj->fail();

		$person_name = $_POST["pname"];

		$check_id = $personMod->findByName($person_name);
		if ($check_id != 0)
			$respObj->fail();
	}

	if ($action == "read" || $action == "edit")
	{
		if (!isset($_POST["pid"]))
			$respObj->fail();
		$p_id = intval($_POST["pid"]);
		if (!$p_id)
			$respObj->fail();
	}

	if ($action == "list")
	{
		$respObj->data = $personMod->getArray();
	}
	else if ($action == "read")
	{
		$pName = $personMod->getName($p_id);

		$respObj->data = array("id" => $p_id, "name" => $pName);
	}
	else if ($action == "new")
	{
		$p_id = $personMod->create($person_name);
		if (!$p_id)
			$respObj->fail();

		$respObj->data = array("id" => $p_id);
	}
	else if ($action == "edit")
	{
		if (!isset($_POST["pid"]))
			$respObj->fail();

		$person_id = intval($_POST["pid"]);
		if (!$personMod->edit($person_id, $person_name))
			$respObj->fail();
	}
	else if ($action == "del")
	{
		if (!isset($_POST["persons"]))
			$respObj->fail();

		$p_list = $db->escape($_POST["persons"]);
		$p_arr = explode(",", $p_list);
		foreach($p_arr as $p_id)
		{
			$p_id = intval($p_id);
			if (!$personMod->del($p_id))
				$respObj->fail();
		}
	}

	$respObj->ok();
