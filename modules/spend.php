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
$comment = mysql_real_escape_string($_POST['comm']);

if (!$acc_id || $amount == 0.0)
	fail();

$query = "INSERT INTO transactions (`id`, `src_id`, `dest_id`, `type`, `amount`, `charge`, `comment`) ".
			"VALUES (NULL, '".$acc_id."', 0, 1, '".$amount."', '".$amount."', '".$comment."');";
$result = mysql_query($query, $dbcnx);
if (mysql_errno())
	fail();

$query = "UPDATE accounts SET balance = balance - ".$amount." WHERE id=".$acc_id.";";
$result = mysql_query($query, $dbcnx);
if (mysql_errno())
	fail();

header("Location: ../index.php?spend=ok");

?>