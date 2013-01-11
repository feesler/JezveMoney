<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");
	require_once("../class/transaction.php");


	function fail()
	{
		setLocation("../index.php?trans=fail");
	}


	$userid = User::check();
	if (!$userid)
		setLocation("../login.php");
/*
	session_start();

	$userid = checkUser("../login.php");
*/

	$dest_id = intval($_POST["destid"]);
	$amount = floatval($_POST["amount"]);
	$charge = floatval($_POST["charge"]);
	$transcurr = intval($_POST["transcurr"]);
	$trdate = strtotime($_POST["date"]);
	$fdate = date("Y-m-d H:i:s", $trdate);
	$comment = $db->escape($_POST["comm"]);

	if (!$dest_id || $amount == 0.0 || $charge == 0.0 || $trdate == -1)
		fail();

	$resArr = $db->selectQ("*", "accounts", "id=".$dest_id);
	if (count($resArr) != 1)
		fail();
	$destBalance = floatval($resArr[0]["balance"]);

	$tr_pos = getLatestTransactionPos($userid);
	$tr_pos++;

	if (!$db->insertQ("transactions", array("id", "user_id", "src_id", "dest_id", "type", "amount", "charge", "curr_id", "date", "comment", "pos"),
								array(NULL, $userid, 0, $dest_id, 2, $amount, $charge, $transcurr, $fdate, $comment, $tr_pos)))
		fail();

	$destBalance += $charge;
	if (!$db->updateQ("accounts", array("balance"), array($destBalance), "id=".$dest_id))
		fail();


	setLocation("../index.php?trans=ok");

?>