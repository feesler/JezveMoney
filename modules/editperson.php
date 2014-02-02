<?php
	require_once("../setup.php");


	function fail($msg = ERR_PERSON_UPDATE)
	{
		setMessage($msg);
		setLocation("../persons.php");
	}


	$user_id = User::check();
	if (!$user_id)
		setLocation("../login.php");

	if (!isset($_POST["pid"]) || !isset($_POST["pname"]))
		fail();

	$person_id = $_POST["pid"];
	$person_name = $_POST["pname"];

	$person = new Person($user_id);
	$check_id = $person->findByName($person_name);
	if ($check_id != 0)
		fail(ERR_PERSON_UPDATE_EXIST);
	if (!$person->edit($person_id, $person_name))
		fail();

	setMessage(MSG_PERSON_UPDATE);
	setLocation("../persons.php");
?>