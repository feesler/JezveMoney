<?php
	require_once("../setup.php");


	function fail()
	{
		setMessage(ERR_PROFILE_NAME);
		setLocation("../profile.php");
	}


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("../login.php");

	if (!isset($_POST["newname"]))
		fail();

	$new_name = $_POST["newname"];
	if (is_null($new_name) || $new_name == "")
		fail();

	$owner_id = $u->getOwner($user_id);
	$person = new Person($user_id);
	$old_name = $person->getName($owner_id);

	if ($old_name == $db->escape($new_name))
		fail();

	if (!$person->edit($owner_id, $new_name))
		fail();

	setMessage(MSG_PROFILE_NAME);
	setLocation("../profile.php");

?>