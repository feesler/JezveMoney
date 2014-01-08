<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/person.php");


	function fail()
	{
		setMessage(ERR_PERSON_UPDATE);
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
	{
		setMessage(ERR_PERSON_UPDATE_EXIST);
		setLocation("../persons.php");
	}
	if (!$person->edit($person_id, $person_name))
		fail();

	setMessage(MSG_PERSON_UPDATE);
	setLocation("../persons.php");
?>