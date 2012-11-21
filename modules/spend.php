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
$charge = floatval($_POST['charge']);
$transcurr = intval($_POST['transcurr']);
$trdate = strtotime($_POST['date']);
$comment = mysql_real_escape_string($_POST['comm']);


if (!$acc_id || $amount == 0.0 || $trdate == -1)
	fail();

$query = "INSERT INTO transactions (`id`, `user_id`, `src_id`, `dest_id`, `type`, `amount`, `charge`, `cur_id`, `date`, `comment`) ".
			"VALUES (NULL, '".$userid."', '".$acc_id."', 0, 1, '".$amount."', '".$charge."', ".$transcurr.", ".$trdate.", '".$comment."');";
$result = $db->rawQ($query, $dbcnx);
if (mysql_errno())
	fail();

$query = "UPDATE accounts SET balance = balance - ".$charge." WHERE id=".$acc_id.";";
$result = $db->rawQ($query, $dbcnx);
if (mysql_errno())
	fail();

header("Location: ../index.php?spend=ok");

?>