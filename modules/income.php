<?php

require_once("../db.php");
require_once("../common.php");


function fail()
{
	header("Location: ../index.php?trans=fail");
	exit();
}


session_start();

$userid = checkUser('../login.php');

$acc_id = intval($_POST['accid']);
$amount = floatval($_POST['amount']);
$trdate = strtotime($_POST['date']);
$comment = mysql_real_escape_string($_POST['comm']);

if (!$acc_id != 0 || $amount == 0.0 || $trdate == -1)
	fail();

$query = "INSERT INTO transactions (`id`, `src_id`, `dest_id`, `type`, `amount`, `charge`, `date`, `comment`) ".
			"VALUES (NULL, 0, '".$acc_id."', 2, '".$amount."', '".$amount."', ".$trdate.", '".$comment."');";
$result = mysql_query($query, $dbcnx);
if (mysql_errno())
	fail();

$query = "UPDATE accounts SET balance = balance + ".$amount." WHERE id=".$acc_id.";";
$result = mysql_query($query, $dbcnx);
if (mysql_errno())
	fail();

header("Location: ../index.php?trans=ok");

?>