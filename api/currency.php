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
	if ($action != "list" && $action != "read")
		fail();

	$person = new Person($user_id);
	if ($action == "read")
	{
		if (!isset($_POST["curr_id"]))
			fail();
		$curr_id = intval($_POST["curr_id"]);
		if (!$curr_id)
			fail();
	}

	if ($action == "list")
	{
		$currArr = Currency::getArray(TRUE);

		$respObj->data = $currArr;
	}
	else if ($action == "read")
	{
		if (!Currency::is_exist($curr_id))
			fail();

		$currName = Currency::getName($curr_id);
		$currSign = Currency::getSign($curr_id);
		$currFormat = Currency::getFormat($curr_id);

		$respObj->data = array("id" => $curr_id, "name" => $currName, "sign" => $currSign, "format" => $currFormat);
	}

	ok();
?>