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
	if ($action != "read" && $action != "new" && $action != "edit" && $action != "del" && $action != "reset")
		fail();

	if ($action == "new" || $action == "edit")
	{
		if (!isset($_POST["accname"]) || !isset($_POST["balance"]) || !isset($_POST["currency"]) || !isset($_POST["icon"]))
			fail();
	}

	if ($action == "read" || $action == "edit")
	{
		if (!isset($_POST["accid"]))
			fail();
		$acc_id = intval($_POST["accid"]);
		if (!$acc_id)
			fail();
	}

	$acc = new Account($user_id);
	if ($action == "read")
	{
		$props = $acc->getProperties($acc_id);
		if (is_null($props))
			fail();

		$respObj->data = $props;
	}
	else if ($action == "new")
	{
		$owner_id = $u->getOwner($user_id);
		$acc_id = $acc->create($owner_id, $_POST["accname"], $_POST["balance"], $_POST["currency"], $_POST["icon"]);
		if (!$acc_id)
			fail();

		$respObj->data = array("id" => $acc_id);
	}
	else if ($action == "edit")
	{
		if (!$acc->edit($acc_id, $_POST["accname"], $_POST["balance"], $_POST["currency"], $_POST["icon"]))
			fail();
	}
	else if ($action == "del")
	{
		if (!isset($_POST["accounts"]))
			fail();

		$acc_list = $db->escape($_POST["accounts"]);
		$acc_arr = explode(",", $acc_list);
		foreach($acc_arr as $acc_id)
		{
			$acc_id = intval($acc_id);
			if (!$acc->del($acc_id))
				fail();
		}
	}
	else if ($action == "reset")
	{
		if (!$acc->reset())
			fail();
	}

	ok();
?>