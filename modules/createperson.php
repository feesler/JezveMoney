<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/person.php");


	function fail()
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
	{
		setMessage(ERR_PERSON_CREATE_EXIST);
		setLocation("../persons.php");
	}
	if (!$person->create($person_name))
		fail();

	setMessage(MSG_PERSON_CREATE);
	setLocation("../persons.php");
?>