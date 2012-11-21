<?php

require_once("../setup.php");


function fail()
{
	header("Location: ../index.php?trans=fail");
	exit();
}


session_start();

$userid = checkUser('../login.php');

$acc_id = intval($_POST['accid']);
$amount = floatval($_POST['amount']);
$receipt = floatval($_POST['receipt']);
$transcurr = intval($_POST['transcurr']);
$trdate = strtotime($_POST['date']);
$comment = $db->escape($_POST['comm']);

if (!$acc_id != 0 || $amount == 0.0 || $trdate == -1)
	fail();


if (!$db->insertQ("transactions", array("id", "user_id", "src_id", "dest_id", "type", "amount", "charge", "cur_id", "date", "comment"),
							array(NULL, $userid, 0, $acc_id, 2, $amount, $receipt, ".$transcurr.", ".$trdate.", $comment)))
	fail();

$query = "UPDATE accounts SET balance = balance + ".$receipt." WHERE id=".$acc_id.";";
$result = $db->rawQ($query);
if (mysql_errno())
	fail();

header("Location: ../index.php?trans=ok");

?>