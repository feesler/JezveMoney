<?php

require_once("../setup.php");

function fail()
{
	setLocation("../transactions.php?edit=fail");
	exit();
}


// Cancel changes of transaction
function cancelTransaction($trans_id)
{
	global $db;

	// check transaction is exist
	$transArr = $db->selectQ("*", "transactions", "id=".$trans_id);
	if (count($transArr) != 1)
		return FALSE;

	$trans = $transArr[0];
	$src_id = intval($trans["src_id"]);
	$dest_id = intval($trans["dest_id"]);
	$transType = intval($trans["type"]);
	$transAmount = floatval($trans["amount"]);
	$transCharge = floatval($trans["charge"]);

	if ($transType == 1)		// spend
	{
		// check account is exist
		$resArr = $db->selectQ("*", "accounts", "id=".$src_id);
		if (count($resArr) != 1)
			return FALSE;

		$oldBalance = floatval($resArr[0]["balance"]);

		// update balance of account
		$newBalance = $oldBalance + $transCharge;
		if (!$db->updateQ("accounts", array("balance"), array($newBalance), "id=".$src_id))
			fail();
	}
	else if ($transType == 2)		// income
	{
		// check account is exist
		$resArr = $db->selectQ("*", "accounts", "id=".$dest_id);
		if (count($resArr) != 1)
			return FALSE;

		$oldBalance = floatval($resArr[0]["balance"]);

		// update balance of account
		$newBalance = $oldBalance - $transCharge;
		if (!$db->updateQ("accounts", array("balance"), array($newBalance), "id=".$dest_id))
			fail();
	}
	else if ($transType == 3)		// transfer
	{
		// check source account is exist
		$resArr = $db->selectQ("*", "accounts", "id=".$src_id);
		if (count($resArr) != 1)
			return FALSE;

		$oldSrcBalance = floatval($resArr[0]["balance"]);

		// update balance of source account
		$newBalance = $oldSrcBalance + $transAmount;
		if (!$db->updateQ("accounts", array("balance"), array($newBalance), "id=".$src_id))
			return FALSE;

		// check destination account is exist
		$resArr = $db->selectQ("*", "accounts", "id=".$src_id);
		if (count($resArr) != 1)
			return FALSE;

		$oldDestBalance = floatval($resArr[0]["balance"]);

		// update balance of destination account
		$newBalance = $oldDestBalance - $transCharge;
		if (!$db->updateQ("accounts", array("balance"), array($newBalance), "id=".$dest_id))
			return FALSE;
	}
	else
		return FALSE;

	return TRUE;
}


session_start();

$userid = checkUser("../login.php");


$trans_id = intval($_POST["transid"]);
$trans_type = intval($_POST["transtype"]);
$src_id = intval($_POST["srcid"]);
$dest_id = intval($_POST["destid"]);
$amount = floatval($_POST["amount"]);
$charge = floatval($_POST["charge"]);
$trdate = strtotime($_POST["date"]);
$fdate = date("Y-m-d H:i:s", $trdate);
$comment = $db->escape($_POST["comm"]);

if (!$trans_id || !$trans_type || $amount == 0.0 || $charge == 0.0 || $trdate == -1)
	fail();


// check transaction is exist
$transArr = $db->selectQ("*", "transactions", "id=".$trans_id);
if (count($transArr) != 1)
	fail();

// cancel transaction
if (!cancelTransaction($trans_id))
	fail();
/*
// check transaction type is the same
if (intval($transArr[0]["type"]) != $trans_type)
	fail();

$oldAmount = floatval($transArr[0]["amount"]);
$oldCharge = floatval($transArr[0]["charge"]);
*/


if ($trans_type == 1)	// spend
{
	if (!$db->updateQ("transactions", array("src_id", "dest_id", "type", "amount", "charge", "curr_id", "date", "comment"),
								array($src_id, 0, 1, $amount, $charge, $transcurr, $fdate, $comment), "id=".$trans_id))
		fail();

	$query = "UPDATE accounts SET balance = balance - ".$charge." WHERE id=".$src_id.";";
	$result = $db->rawQ($query);
	if (mysql_errno())
		fail();

	setLocation("../transactions.php?type=expense&edit=ok");
/*
	if (!$src_id)
		fail();

	// check account is exist
	$resArr = $db->selectQ("*", "accounts", "id=".$src_id);
	if (count($resArr) != 1)
		fail();

	$oldBalance = floatval($resArr[0]["balance"]);

	if (!$db->updateQ("transactions", array("amount", "charge", "date", "comment"),
								array($amount, $charge, $fdate, $comment), "id=".$trans_id))
		fail();

	// update balance of account
	$newBalance = $oldBalance + $oldCharge - $charge;
	if (!$db->updateQ("accounts", array("balance"), array($newBalance), "id=".$src_id))
		fail();
*/
}
else if ($trans_type == 2)	// income
{
	if (!$db->updateQ("transactions", array("src_id", "dest_id", "type", "amount", "charge", "curr_id", "date", "comment"),
								array(0, $dest_id, 2, $amount, $charge, $transcurr, $fdate, $comment), "id=".$trans_id))
		fail();
	
	$query = "UPDATE accounts SET balance = balance + ".$charge." WHERE id=".$acc_id.";";
	$result = $db->rawQ($query);
	if (mysql_errno())
		fail();

	setLocation("../transactions.php?type=income&edit=ok");
/*
	if (!$dest_id)
		fail();

	// check account is exist
	$resArr = $db->selectQ("*", "accounts", "id=".$dest_id);
	if (count($resArr) != 1)
		fail();

	$oldBalance = floatval($resArr[0]["balance"]);

	// update transaction
	if (!$db->updateQ("transactions", array("amount", "charge", "date", "comment"),
								array($amount, $charge, $fdate, $comment), "id=".$trans_id))
		fail();

	// update balance of account
	$newBalance = $oldBalance - $oldCharge + $charge;
	if (!$db->updateQ("accounts", array("balance"), array($newBalance), "id=".$src_id))
		fail();
*/
}
else if ($trans_type == 3)	// transfer
{
	$resArr = $db->selectQ("id", "accounts", "id=".$dest_id);
	if (count($resArr) != 1)
		fail();
	$dest_curr_id = intval($resArr[0]["curr_id"]);		// currency of destination account is currency of transaction

	if (!$db->updateQ("transactions", array("src_id", "dest_id", "type", "amount", "charge", "curr_id", "date", "comment"),
								array($src_id, $dest_id, 3, $amount, $charge, $dest_curr_id, $fdate, $comment), "id=".$trans_id))
		fail();

	$query = "UPDATE accounts SET balance = balance - ".$amount." WHERE id=".$src_id.";";
	$result = $db->rawQ($query, $dbcnx);
	if (mysql_errno())
		fail();

	$query = "UPDATE accounts SET balance = balance + ".$charge." WHERE id=".$dest_id.";";
	$result = $db->rawQ($query, $dbcnx);
	if (mysql_errno())
		fail();

	setLocation("../transactions.php?type=transfer&edit=ok");
/*
	if (!$src_id || !$dest_id)
		fail();

	// check source account is exist
	$resArr = $db->selectQ("*", "accounts", "id=".$src_id);
	if (count($resArr) != 1)
		fail();

	$oldSrcBalance = floatval($resArr[0]["balance"]);

	// check destination account is exist
	$resArr = $db->selectQ("*", "accounts", "id=".$src_id);
	if (count($resArr) != 1)
		fail();
	$dest_curr_id = intval($resArr[0]["curr_id"]);

	$oldDestBalance = floatval($resArr[0]["balance"]);

	// update transaction
	if (!$db->updateQ("transactions", array("amount", "charge", "curr_id", "date", "comment"),
								array($amount, $charge, $dest_curr_id, $fdate, $comment), "id=".$trans_id))
		fail();

	// update balance of source account
	$newBalance = $oldSrcBalance + $oldAmount - $amount;
	if (!$db->updateQ("accounts", array("balance"), array($newBalance), "id=".$src_id))
		fail();

	// update balance of destination account
	$newBalance = $oldDestBalance - $charge + $amount;
	if (!$db->updateQ("accounts", array("balance"), array($newBalance), "id=".$src_id))
		fail();
*/
}
else
	fail();

?>