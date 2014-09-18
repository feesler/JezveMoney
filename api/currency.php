<?php
	require_once("../setup.php");


	$respObj = new apiResponse();

	$u = new User();
	$user_id = $u->check();
	if ($user_id == 0)
		$respObj->fail();

	if (isset($_GET["act"]))
		$action = $_GET["act"];
	if ($action != "list" && $action != "read")
		$respObj->fail();

	$person = new Person($user_id);
	if ($action == "read")
	{
		if (!isset($_POST["curr_id"]))
			$respObj->fail();
		$curr_id = intval($_POST["curr_id"]);
		if (!$curr_id)
			$respObj->fail();
	}

	if ($action == "list")
	{
		$currArr = Currency::getArray(TRUE);

		$respObj->data = $currArr;
	}
	else if ($action == "read")
	{
		if (!Currency::is_exist($curr_id))
			$respObj->fail();

		$currName = Currency::getName($curr_id);
		$currSign = Currency::getSign($curr_id);
		$currFormat = Currency::getFormat($curr_id);

		$respObj->data = array("id" => $curr_id, "name" => $currName, "sign" => $currSign, "format" => $currFormat);
	}

	$respObj->ok();
?>