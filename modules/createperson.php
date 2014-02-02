<?php
	require_once("../setup.php");


	function fail($msg = ERR_PERSON_CREATE)
	{
		setMessage(ERR_PERSON_CREATE);
		setLocation("../persons.php");
	}


	$user_id = User::check();
	if (!$user_id)
		setLocation("../login.php");

	if (!isset($_POST["pname"]))
		fail();

	$person_name = $_POST["pname"];

	$person = new Person($user_id);
	$check_id = $person->findByName($person_name);
	if ($check_id != 0)
		fail(ERR_PERSON_CREATE_EXIST);
	if (!$person->create($person_name))
		fail();

	setMessage(MSG_PERSON_CREATE);
	setLocation("../persons.php");
?>