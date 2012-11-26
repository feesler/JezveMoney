<?php

require_once("../setup.php");


function fail()
{
	setLocation("../index.php?trans=fail");
	exit();
}


session_start();

$userid = checkUser("../login.php");

$destid = intval($_POST["destid"]);
$amount = floatval($_POST["amount"]);
$receipt = floatval($_POST["receipt"]);
$transcurr = intval($_POST["transcurr"]);
$trdate = strtotime($_POST["date"]);
$fdate = date("Y-m-d H:i:s", $trdate);
$comment = $db->escape($_POST["comm"]);

if (!$destid != 0 || $amount == 0.0 || $trdate == -1)
	fail();


if (!$db->insertQ("transactions", array("id", "user_id", "src_id", "dest_id", "type", "amount", "charge", "curr_id", "date", "comment"),
							array(NULL, $userid, 0, $destid, 2, $amount, $receipt, $transcurr, $fdate, $comment)))
	fail();

$query = "UPDATE accounts SET balance = balance + ".$receipt." WHERE id=".$destid.";";
$result = $db->rawQ($query);
if (mysql_errno())
	fail();

setLocation("../index.php?trans=ok");

?>