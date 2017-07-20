<?php
	require_once("../system/setup.php");


	$respObj = new apiResponse();

	$uMod = new UserModel();
	$user_id = $uMod->check();
	if ($user_id == 0)
		$respObj->fail();

	if (isset($_GET["act"]))
		$action = $_GET["act"];

	$availActions = array("read", "changename", "changepass", "reset");
	if (!in_array($action, $availActions))
		$respObj->fail();

	$pMod = new PersonModel($user_id);
	$owner_id = $uMod->getOwner($user_id);
	if ($action == "read")
	{
		$pName = $pMod->getName($owner_id);

		$respObj->data = array("name" => $pName);
	}
	else if ($action == "changename")
	{
		$old_name = $pMod->getName($owner_id);
		$new_name = $_POST["name"];

		if ($old_name == $db->escape($new_name))
			$respObj->fail(getMessage(ERR_PROFILE_NAME));

		if (!$pMod->edit($owner_id, $new_name))
			$respObj->fail(getMessage(ERR_PROFILE_NAME));

		$respObj->msg = getMessage(MSG_PROFILE_NAME);
		$respObj->data = array("name" => $new_name);
	}
	else if ($action == "changepass")
	{
		if (!isset($_POST["oldpwd"]) || !isset($_POST["newpwd"]))
			$respObj->fail(getMessage(ERR_PROFILE_PASSWORD));

		$login = $uMod->getLogin($user_id);
		if (!$uMod->changePassword($login, $_POST["oldpwd"], $_POST["newpwd"]))
			$respObj->fail(getMessage(ERR_PROFILE_PASSWORD));

		$respObj->msg = getMessage(MSG_PROFILE_PASSWORD);
	}
	else if ($action == "reset")
	{
		$accMod = new AccountModel($user_id);
		if (!$accMod->reset())
			$this->fail(getMessage(ERR_PROFILE_RESETALL));

		if (!$pMod->reset())
			$this->fail(getMessage(ERR_PROFILE_RESETALL));

		$respObj->msg = getMessage(MSG_PROFILE_RESETALL);
	}

	$respObj->ok();
