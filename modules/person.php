<?php
	require_once("../setup.php");


	function fail($msg = NULL)
	{
		if (!is_null($msg))
			setMessage($msg);
		setLocation("../persons.php");
	}


	checkUser();

	if (isset($_GET["act"]))
		$action = $_GET["act"];
	if ($action != "new" && $action != "edit" && $action != "del")
		fail();

	if ($action == "new")
		$defMsg = ERR_PERSON_CREATE;
	else if ($action == "edit")
		$defMsg = ERR_PERSON_UPDATE;
	else if ($action == "del")
		$defMsg = ERR_PERSON_DELETE;

	$person = new Person($user_id);
	if ($action == "new" || $action == "edit")
	{
		if (!isset($_POST["pname"]))
			fail($defMsg);

		$person_name = $_POST["pname"];

		$check_id = $person->findByName($person_name);
		if ($check_id != 0)
			fail(ERR_PERSON_UPDATE_EXIST);
	}

	if ($action == "new")
	{
		if (!$person->create($person_name))
			fail($defMsg);

		setMessage(MSG_PERSON_CREATE);
	}
	else if ($action == "edit")
	{
		if (!isset($_POST["pid"]))
			fail($defMsg);

		$person_id = intval($_POST["pid"]);
		if (!$person->edit($person_id, $person_name))
			fail($defMsg);

		setMessage(MSG_PERSON_UPDATE);
	}
	else if ($action == "del")
	{
		if (!isset($_POST["persons"]))
			fail($defMsg);

		$p_list = $db->escape($_POST["persons"]);
		$p_arr = explode(",", $p_list);
		foreach($p_arr as $p_id)
		{
			$p_id = intval($p_id);
			if (!$person->del($p_id))
				fail($defMsg);
		}

		setMessage(MSG_PERSON_DELETE);
	}

	setLocation("../persons.php");
?>