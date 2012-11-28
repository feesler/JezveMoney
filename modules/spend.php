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
$amount = floatval($_POST["amount"]);
$charge = floatval($_POST["charge"]);
$transcurr = intval($_POST["transcurr"]);
$trdate = strtotime($_POST["date"]);
$fdate = date("Y-m-d H:i:s", $trdate);
$comment = $db->escape($_POST["comm"]);

if (!$src_id || $amount == 0.0 || $charge == 0.0 || $trdate == -1)
	fail();

$resArr = $db->selectQ("*", "accounts", "id=".$src_id);
if (count($resArr) != 1)
	fail();
$srcBalance = floatval($resArr[0]["balance"]);

if (!$db->insertQ("transactions", array("id", "user_id", "src_id", "dest_id", "type", "amount", "charge", "curr_id", "date", "comment"),
							array(NULL, $userid, $src_id, 0, 1, $amount, $charge, $transcurr, $fdate, $comment)))
	fail();

$srcBalance -= $charge;
if (!$db->updateQ("accounts", array("balance"), array($srcBalance), "id=".$src_id))
	fail();


setLocation("../index.php?spend=ok");

?>