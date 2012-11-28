<?php

require_once("../setup.php");


function fail()
{
	setLocation("../index.php?trans=fail");
	exit();
}


session_start();

$userid = checkUser("../login.php");

$dest_id = intval($_POST["destid"]);
$amount = floatval($_POST["amount"]);
$receipt = floatval($_POST["receipt"]);
$transcurr = intval($_POST["transcurr"]);
$trdate = strtotime($_POST["date"]);
$fdate = date("Y-m-d H:i:s", $trdate);
$comment = $db->escape($_POST["comm"]);

if (!$dest_id || $amount == 0.0 || $receipt == 0.0 || $trdate == -1)
	fail();

$resArr = $db->selectQ("*", "accounts", "id=".$dest_id);
if (count($resArr) != 1)
	fail();
$destBalance = floatval($resArr[0]["balance"]);

if (!$db->insertQ("transactions", array("id", "user_id", "src_id", "dest_id", "type", "amount", "charge", "curr_id", "date", "comment"),
							array(NULL, $userid, 0, $dest_id, 2, $amount, $receipt, $transcurr, $fdate, $comment)))
	fail();

$destBalance += $receipt;
if (!$db->updateQ("accounts", array("balance"), array($destBalance), "id=".$dest_id))
	fail();


setLocation("../index.php?trans=ok");

?>