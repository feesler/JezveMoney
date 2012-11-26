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


if (!$src_id || $amount == 0.0 || $trdate == -1)
	fail();

if (!$db->insertQ("transactions", array("id", "user_id", "src_id", "dest_id", "type", "amount", "charge", "curr_id", "date", "comment"),
							array(NULL, $userid, $src_id, 0, 1, $amount, $charge, $transcurr, $fdate, $comment)))
	fail();

$query = "UPDATE accounts SET balance = balance - ".$charge." WHERE id=".$src_id.";";
$result = $db->rawQ($query);
if (mysql_errno())
	fail();

setLocation("../index.php?spend=ok");

?>