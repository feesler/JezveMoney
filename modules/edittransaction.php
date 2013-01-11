<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");
	require_once("../class/transaction.php");


	function fail()
	{
		setLocation("../transactions.php?edit=fail");
	}


	$userid = User::check();
	if (!$userid)
		setLocation("../login.php");
/*
	session_start();

	$userid = checkUser("../login.php");
*/


	$trans_id = intval($_POST["transid"]);
	$trans_type = intval($_POST["transtype"]);
	$src_id = intval($_POST["srcid"]);
	$dest_id = intval($_POST["destid"]);
	$amount = floatval($_POST["amount"]);
	$charge = floatval($_POST["charge"]);
	$transcurr = intval($_POST["transcurr"]);
	$trdate = strtotime($_POST["date"]);
	$fdate = date("Y-m-d H:i:s", $trdate);
	$comment = $db->escape($_POST["comm"]);

	if (!$trans_id || !$trans_type || (!$src_id && !$dest_id) || $amount == 0.0 || $charge == 0.0 || $trdate == -1)
		fail();


	// check transaction is exist
	$transArr = $db->selectQ("*", "transactions", "id=".$trans_id);
	if (count($transArr) != 1)
		fail();

	// cancel transaction
	if (!cancelTransaction($trans_id))
		fail();


	// check source account is exist
	$srcBalance = 0;
	if ($src_id != 0)
	{
		$resArr = $db->selectQ("*", "accounts", "id=".$src_id);
		if (count($resArr) != 1)
			return FALSE;

		$srcBalance = floatval($resArr[0]["balance"]);
	}

	// check destination account is exist
	$destBalance = 0;
	if ($dest_id != 0)
	{
		$resArr = $db->selectQ("*", "accounts", "id=".$dest_id);
		if (count($resArr) != 1)
			return FALSE;

		$destBalance = floatval($resArr[0]["balance"]);
		$dest_curr_id = intval($resArr[0]["curr_id"]);		// currency of destination account is currency of transfer transaction
	}

	if ($trans_type == 1)	// spend
	{
		if (!$db->updateQ("transactions", array("src_id", "dest_id", "type", "amount", "charge", "curr_id", "date", "comment"),
						array($src_id, 0, 1, $amount, $charge, $transcurr, $fdate, $comment), "id=".$trans_id))
			fail();

		$srcBalance -= $charge;
		if (!$db->updateQ("accounts", array("balance"), array($srcBalance), "id=".$src_id))
			fail();

		setLocation("../transactions.php?type=expense&edit=ok");
	}
	else if ($trans_type == 2)	// income
	{
		if (!$db->updateQ("transactions", array("src_id", "dest_id", "type", "amount", "charge", "curr_id", "date", "comment"),
						array(0, $dest_id, 2, $amount, $charge, $transcurr, $fdate, $comment), "id=".$trans_id))
			fail();

		$destBalance += $charge;
		if (!$db->updateQ("accounts", array("balance"), array($destBalance), "id=".$dest_id))
			fail();	

		setLocation("../transactions.php?type=income&edit=ok");
	}
	else if ($trans_type == 3)	// transfer
	{
		if (!$db->updateQ("transactions", array("src_id", "dest_id", "type", "amount", "charge", "curr_id", "date", "comment"),
									array($src_id, $dest_id, 3, $amount, $charge, $dest_curr_id, $fdate, $comment), "id=".$trans_id))
			fail();

		$srcBalance -= $charge;
		if (!$db->updateQ("accounts", array("balance"), array($srcBalance), "id=".$src_id))
			fail();

		$destBalance += $amount;
		if (!$db->updateQ("accounts", array("balance"), array($destBalance), "id=".$dest_id))
			fail();

		setLocation("../transactions.php?type=transfer&edit=ok");
	}
	else
		fail();

?>