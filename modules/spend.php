<?php

require_once("../db.php");
require_once("../common.php");

session_start();

$userid = checkUser('../login.php');

$acc_id = intval($_POST['accid']);
$value = floatval($_POST['amount']);
$comment = mysql_real_escape_string($_POST['comm']);

if ($acc_id != 0 && $value != 0.0)
{
	$query = "INSERT INTO transactions (`id`, `account_id`, `type`, `value`, `comment`) ".
			"VALUES (NULL, '".$acc_id."', '1', '".$value."', '".$comment."');";
	$result = mysql_query($query, $dbcnx);

echo($query."\r\n");
echo(mysql_errno().":".mysql_error()."\r\n");
/*
	if (!mysql_errno())
	{
		$query2 = "UPDATE accounts SET balance = balance - ".$value." WHERE id=".$acc_id.";";
		$result2 = mysql_query($query2, $dbcnx);
	}*/
}

//header("Location: ../index.php");

?>