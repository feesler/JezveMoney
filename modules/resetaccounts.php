<?php
require_once("../db.php");
require_once("../common.php");


function fail()
{
	header("Location: ../resetaccounts.php?act=fail");
	exit();
}


session_start();

$userid = checkUser('../login.php');
if (!is_numeric($userid))
	fail();

// delete all transactions of user
$query = "SELECT id FROM accounts WHERE user_id=".$userid.";";
$result = mysql_query($query, $dbcnx);
if (mysql_errno())
	fail();

while($row = mysql_fetch_array($result))
{
	$acc_id = $row["id"];

	$query2 = "DELETE FROM accounts WHERE src_id=".$acc_id." OR dest_id=".$acc_id.";";
	$result2 = mysql_query($query2, $dbcnx);
	if (mysql_errno())
		fail();
}


// delete all accounts of user
$query = "DELETE FROM accounts WHERE user_id=".$userid.";";
$result = mysql_query($query, $dbcnx);
if (mysql_errno())
	fail();


header("Location: ../accounts.php?reset=ok");

?>