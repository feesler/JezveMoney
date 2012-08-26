<?php

require_once("../db.php");
require_once("../common.php");

session_start();

if (isset($_SESSION["userid"]))
	$userid = $_SESSION["userid"];

$acc_id = intval($_POST['acc_id']);
$value = floatval($_POST['amount']);
$comment = mysql_real_escape_string($_POST['comm']);

if ($acc_id != 0 && $value != 0.0)
{
	$query = "INSERT INTO transactions (`id`, `account_id`, `type`, `value`) VALUES (NULL, '".$acc_id."', '1', '".$balance."', '".$balance."', '".$name."');";
	$result = mysql_query($query, $dbcnx);

	if (!mysql_errno())
	{
		$query2 = "UPDATE accounts SET balance = balance - ".$value." WHERE id=".$acc_id.";";
		$result2 = mysql_query($query2, $dbcnx);
	}
}

header("Location: ../index.php");

?>