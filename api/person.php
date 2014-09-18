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
	if ($action != "list" && $action != "read" && $action != "new" && $action != "edit" && $action != "del")
		fail();

	$person = new Person($user_id);
	if ($action == "new" || $action == "edit")
	{
		if (!isset($_POST["pname"]))
			fail();

		$person_name = $_POST["pname"];

		$check_id = $person->findByName($person_name);
		if ($check_id != 0)
			fail();
	}

	if ($action == "read" || $action == "edit")
	{
		if (!isset($_POST["pid"]))
			fail();
		$p_id = intval($_POST["pid"]);
		if (!$p_id)
			fail();
	}

	if ($action == "list")
	{
		$pArr = $person->getArray();

		$respObj->data = $pArr;
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
			fail();

		$respObj->data = array("id" => $p_id);
	}
	else if ($action == "edit")
	{
		if (!isset($_POST["pid"]))
			fail();

		$person_id = intval($_POST["pid"]);
		if (!$person->edit($person_id, $person_name))
			fail();
	}
	else if ($action == "del")
	{
		if (!isset($_POST["persons"]))
			fail();

		$p_list = $db->escape($_POST["persons"]);
		$p_arr = explode(",", $p_list);
		foreach($p_arr as $p_id)
		{
			$p_id = intval($p_id);
			if (!$person->del($p_id))
				fail();
		}
	}

	ok();
?>