<?php
	require_once("../setup.php");


	function fail()
	{
		setMessage(ERR_TRANS_DELETE);
		setLocation("../transactions.php");
	}


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("../login.php");

	$trans_list = $db->escape($_POST["transactions"]);
	if (!$trans_list || $trans_list == "")
		fail();

	$trans = new Transaction($user_id);

	$trans_arr = explode(",", $trans_list);
	foreach($trans_arr as $trans_id)
	{
		$trans_id = intval($trans_id);
		if (!$trans->del($trans_id))
			fail();
	}

	setMessage(MSG_TRANS_DELETE);
	setLocation("../transactions.php");
?>