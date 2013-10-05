<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/account.php");
	require_once("../class/person.php");
	require_once("../class/transaction.php");


	function fail()
	{
		setLocation("../persons.php?del=fail");
	}


	$user_id = User::check();
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

	setLocation("../persons.php?del=ok");
?>