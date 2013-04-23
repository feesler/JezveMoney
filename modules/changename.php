<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/person.php");


	function fail()
	{
		setLocation("../profile.php?act=fail");
	}


	$user_id = User::check();
	if (!$user_id)
		setLocation("../login.php");

	if (!isset($_POST["newname"]))
		fail();

	$new_name = $_POST["newname"];
	if (is_null($new_name) || $new_name == "")
		fail();

	$owner_id = User::getOwner($user_id);
	$person = new Person($user_id);
	$old_name = $person->getName($owner_id);

	if ($old_name == $db->escape($new_name))
		fail();

	if (!$person->edit($owner_id, $new_name))
		fail();

	setLocation("../profile.php?act=ok");

?>