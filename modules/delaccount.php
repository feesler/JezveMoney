﻿<?php
	require_once("../setup.php");


	function fail()
	{
		setMessage(ERR_ACCOUNT_DELETE);
		setLocation("../accounts.php");
	}


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("../login.php");

	if (!isset($_POST["accounts"]))
		fail();

	$acc_list = $db->escape($_POST["accounts"]);

	$acc = new Account($user_id);

	$acc_arr = explode(",", $acc_list);
	foreach($acc_arr as $acc_id)
	{
		if (!$acc->del($acc_id))
			fail();
	}

	setMessage(MSG_ACCOUNT_DELETE);
	setLocation("../accounts.php");
?>