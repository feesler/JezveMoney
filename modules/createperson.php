<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/person.php");


	function fail()
	{
		setLocation("../persons.php?new=fail");
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
		setLocation("../persons.php?new=fail&detail=exist");
	if (!$person->create($person_name))
		fail();

	setLocation("../persons.php?new=ok");
?>