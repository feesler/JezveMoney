<?php

require_once("../setup.php");

function fail()
{
	setLocation("../index.php?trans=fail");
	exit();
}


session_start();

$userid = checkUser("../login.php");


$src_id = intval($_POST["srcid"]);
$dest_id = intval($_POST["destid"]);
$amount = floatval($_POST["amount"]);
$charge = floatval($_POST["charge"]);
$trdate = strtotime($_POST["date"]);
$fdate = date("Y-m-d H:i:s", $trdate);
$comment = $db->escape($_POST["comm"]);

if (!$src_id || !$dest_id || $amount == 0.0 || $charge == 0.0 || $trdate == -1)
	fail();


$resArr = $db->selectQ("id", "accounts", "id=".$src_id);
if (count($resArr) != 1)
	fail();


$resArr = $db->selectQ("*", "accounts", "id=".$dest_id);
if (count($resArr) != 1)
	fail();
$dest_curr_id = intval($resArr[0]["curr_id"]);

if (!$db->insertQ("transactions", array("id", "user_id", "src_id", "dest_id", "type", "amount", "charge", "curr_id", "date", "comment"),
							array(NULL, $userid, $src_id, $dest_id, 3, $amount, $charge, $dest_curr_id, $fdate, $comment)))
	fail();


$resArr = $db->selectQ("balance", "accounts", "id=".$src_id);
if (count($resArr == 1))
	$balance = floatval($resArr[0]["balance"]);
$balance -= $amount;
if (!$db->updateQ("accounts", array("balance"), array($balance), "id=".$src_id))
	fail();

/*
$query = "UPDATE accounts SET balance = balance - ".$amount." WHERE id=".$src_id.";";
$result = $db->rawQ($query, $dbcnx);
if (mysql_errno())
	fail();
*/

$resArr = $db->selectQ("balance", "accounts", "id=".$dest_id);
if (count($resArr == 1))
	$balance = floatval($resArr[0]["balance"]);
$balance += $charge;
if (!$db->updateQ("accounts", array("balance"), array($balance), "id=".$dest_id))
	fail();

/*
$query = "UPDATE accounts SET balance = balance + ".$charge." WHERE id=".$dest_id.";";
$result = $db->rawQ($query, $dbcnx);
if (mysql_errno())
	fail();
*/


setLocation("../index.php?trans=ok");

?>