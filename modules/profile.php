<?php
	require_once("../setup.php");


	function fail($msg = NULL)
	{
		if (!is_null($msg))
			setMessage($msg);
		setLocation("../profile.php");
	}


	checkUser();

	if (isset($_GET["act"]))
		$action = $_GET["act"];
	if ($action != "changename" && $action != "changepass" && $action != "resetall")
		fail();

	if ($action == "changename")
		$defMsg = ERR_PROFILE_NAME;
	else if ($action == "changepass")
		$defMsg = ERR_PROFILE_PASSWORD;
	else if ($action == "resetall")
		$defMsg = ERR_PROFILE_RESETALL;

	if ($action == "changename")
	{
		if (!isset($_POST["newname"]))
			fail($defMsg);

		$new_name = $_POST["newname"];
		if (is_null($new_name) || $new_name == "")
			fail($defMsg);

		$owner_id = $u->getOwner($user_id);
		$person = new Person($user_id);
		$old_name = $person->getName($owner_id);

		if ($old_name == $db->escape($new_name))
			fail($defMsg);

		if (!$person->edit($owner_id, $new_name))
			fail($defMsg);

		setMessage(MSG_PROFILE_NAME);
	}
	else if ($action == "changepass")
	{
		if (!isset($_POST["oldpwd"]) || !isset($_POST["newpwd"]))
			fail($defMsg);

		$login = $u->getLogin($user_id);
		if (!$u->changePassword($login, $_POST["oldpwd"], $_POST["newpwd"]))
			fail($defMsg);

		setMessage(MSG_PROFILE_PASSWORD);
	}
	else if ($action == "resetall")
	{
		$acc = new Account($user_id);
		if (!$acc->reset())
			fail($defMsg);

		$pers = new Person($user_id);
		if (!$pers->reset())
			fail($defMsg);

		setMessage(MSG_PROFILE_RESETALL);
	}

	setLocation("../profile.php");

?>