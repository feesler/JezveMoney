<?php

require_once("../setup.php");

function fail()
{
	setLocation("../transactions.php?edit=fail");
	exit();
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

wlog("1");

// check transaction type is the same
if (intval($transArr[0]["type"]) != $trans_type)
	fail();

wlog("2");

$oldAmount = floatval($transArr[0]["amount"]);
$oldCharge = floatval($transArr[0]["charge"]);


wlog("trans_type=".$trans_type);

if ($trans_type == 1)	// spend
{
wlog("3");
wlog("src_id=".$src_id);

	if (!$src_id)
		fail();

wlog("4");

	// check account is exist
	$resArr = $db->selectQ("*", "accounts", "id=".$src_id);
	if (count($resArr) != 1)
		fail();

wlog("5");

	$oldBalance = floatval($resArr[0]["balance"]);

	if (!$db->updateQ("transactions", array("amount", "charge", "date", "comment"),
								array($amount, $charge, $fdate, $comment), "id=".$trans_id))
		fail();

wlog("6");

	// update balance of account
	$newBalance = $oldBalance + $oldCharge - $charge;
	if (!$db->updateQ("accounts", array("balance"), array($newBalance), "id=".$src_id))
		fail();

wlog("7");
}
else if ($trans_type == 2)	// income
{
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
}
else if ($trans_type == 3)	// transfer
{
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

	$oldDestBalance = floatval($resArr[0]["balance"]);

	// update transaction
	if (!$db->updateQ("transactions", array("amount", "charge", "date", "comment"),
								array($amount, $charge, $fdate, $comment), "id=".$trans_id))
		fail();

	// update balance of source account
	$newBalance = $oldSrcBalance + $oldAmount - $amount;
	if (!$db->updateQ("accounts", array("balance"), array($newBalance), "id=".$src_id))
		fail();

	// update balance of destination account
	$newBalance = $oldDestBalance - $charge + $amount;
	if (!$db->updateQ("accounts", array("balance"), array($newBalance), "id=".$src_id))
		fail();
}


setLocation("../transactions.php?edit=ok");

?>