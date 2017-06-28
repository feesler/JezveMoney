<?php
	require_once("../system/setup.php");


	$respObj = new apiResponse();

	$uMod = new UserModel();
	$user_id = $uMod->check();
	if ($user_id == 0)
		$respObj->fail();

	if (isset($_GET["act"]))
		$action = $_GET["act"];
	if ($action != "list" && $action != "read")
		$respObj->fail();

	$pMod = new PersonModel($user_id);
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
		$respObj->data = CurrencyModel::getArray();
	}
	else if ($action == "read")
	{
		if (!CurrencyModel::is_exist($curr_id))
			$respObj->fail();

		$currName = CurrencyModel::getName($curr_id);
		$currSign = CurrencyModel::getSign($curr_id);
		$currFormat = CurrencyModel::getFormat($curr_id);

		$respObj->data = array("id" => $curr_id, "name" => $currName, "sign" => $currSign, "format" => $currFormat);
	}

	$respObj->ok();
