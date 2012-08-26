<?php
require_once("../db.php");
require_once("../common.php");


function fail()
{
	header("Location: ../accounts.php?edit=fail");
}


session_start();

$userid = checkUser('../login.php');


if (!is_numeric($_POST['accid']))
	fail();
$acc_id = intval($_POST['accid']);

if (!is_numeric($_POST['acccurr']))
	fail();
$curr_id = intval($_POST['acccurr']);

$initbal = floatval($_POST['initbal']);
$accname = mysql_real_escape_string($_POST['accname']);


if ($acc_id != 0 && $curr_id != 0)
{
	$diff = 0.0;

// check is currency exist
	$arr = selectQuery('id', 'currency', 'id='.$curr_id);
	if (!$arr)
		fail();

// get initial balance to calc difference
	$arr = selectQuery('initbalance', 'accounts', 'id='.$acc_id);
	if (!$arr)
		fail();

	$diff = $initbal - $arr['initbalance'];

	$query = "UPDATE accounts SET name = '".$accname."', curr_id = ".$curr_id;

	if (abs($diff) > 0.01)
		$query .= ", balance = balance + ".$diff.", initbalance = ".$initbal;

	$query .= " WHERE id=".$acc_id.";";

	$result = mysql_query($query, $dbcnx);
	if (mysql_errno())
		fail();
}


header("Location: ../accounts.php?edit=ok");

?>