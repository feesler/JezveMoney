<?php
	require_once("../setup.php");


	function fail()
	{
		setMessage(ERR_PERSON_DELETE);
		setLocation("../persons.php");
	}


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("../login.php");

	if (!isset($_POST["persons"]))
		fail();

	$p_list = $db->escape($_POST["persons"]);

	$person = new Person($user_id);

	$p_arr = explode(",", $p_list);
	foreach($p_arr as $p_id)
	{
		if (!$person->del($p_id))
			fail();
	}

	setMessage(MSG_PERSON_DELETE);
	setLocation("../persons.php");
?>