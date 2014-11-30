<?php
	require_once("../system/setup.php");


	$respObj = new apiResponse();

	$u = new User();
	$user_id = $u->check();
	if ($user_id == 0)
		$respObj->fail();

	if (isset($_GET["act"]))
		$action = $_GET["act"];
	if ($action != "list" && $action != "read" && $action != "new" && $action != "edit" && $action != "del")
		$respObj->fail();

	$person = new Person($user_id);
	if ($action == "new" || $action == "edit")
	{
		if (!isset($_POST["pname"]))
			$respObj->fail();

		$person_name = $_POST["pname"];

		$check_id = $person->findByName($person_name);
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
		$pArr = $person->getArray();
		$respObj->data = array();
		foreach($pArr as $pers)
		{
			$pObj = new apiObject;
			$pObj->id = $pers[0];
			$pObj->name = $pers[1];
			$pObj->accounts = array();
			foreach($pers[2] as $pAcc)
			{
				$pAccObj = new apiObject;
				$pAccObj->id = $pAcc[0];
				$pAccObj->curr_id = $pAcc[1];
				$pAccObj->balance = $pAcc[2];

				$pObj->accounts[] = $pAccObj;
			}

			$respObj->data[] = $pObj;
		}
	}
	else if ($action == "read")
	{
		$pName = $person->getName($p_id);

		$respObj->data = array("id" => $p_id, "name" => $pName);
	}
	else if ($action == "new")
	{
		$p_id = $person->create($person_name);
		if (!$p_id)
			$respObj->fail();

		$respObj->data = array("id" => $p_id);
	}
	else if ($action == "edit")
	{
		if (!isset($_POST["pid"]))
			$respObj->fail();

		$person_id = intval($_POST["pid"]);
		if (!$person->edit($person_id, $person_name))
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
			if (!$person->del($p_id))
				$respObj->fail();
		}
	}

	$respObj->ok();
