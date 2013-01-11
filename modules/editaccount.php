<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");


	function fail()
	{
		setLocation("../accounts.php?edit=fail");
	}


	session_start();

	$userid = checkUser("../login.php");

	if (!isset($_POST["accid"]) || !isset($_POST["accname"]) || !isset($_POST["acccurr"]) || !isset($_POST["initbal"]))
		fail();

	$acc = new Account($userid);

	if (!$acc->edit($_POST["accid"], $_POST["accname"], $_POST["initbal"], $_POST["acccurr"]))
		fail();

/*
	if (!is_numeric($_POST["accid"]))
		fail();
	$acc_id = intval($_POST["accid"]);

	if (!is_numeric($_POST["acccurr"]))
		fail();
	$curr_id = intval($_POST["acccurr"]);

	$initbal = floatval($_POST["initbal"]);
	$accname = mysql_real_escape_string($_POST["accname"]);


	if ($acc_id != 0 && $curr_id != 0)
	{
		$diff = 0.0;

	// check is currency exist
		$resArr = $db->selectQ("id", "currency", "id=".$curr_id);
		if (!count($resArr))
			fail();

	// get initial balance to calc difference
		$resArr = $db->selectQ("initbalance", "accounts", "id=".$acc_id);
		if (!count($resArr))
			fail();
		$arr = $resArr[0];

		$diff = $initbal - $arr["initbalance"];

		$query = "UPDATE accounts SET name = ".qnull($accname).", curr_id = ".$curr_id;

		if (abs($diff) > 0.01)
			$query .= ", balance = balance + ".$diff.", initbalance = ".$initbal;

		$query .= " WHERE id=".$acc_id.";";

		$result = $db->rawQ($query);
		if (mysql_errno())
			fail();
	}
*/


	setLocation("../accounts.php?edit=ok");

?>