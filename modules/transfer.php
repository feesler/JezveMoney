<?php

require_once("../setup.php");

function fail()
{
	header("Location: ../index.php?trans=fail");
	exit();
}


session_start();

$userid = checkUser('../login.php');


$src_id = intval($_POST['srcid']);
$dest_id = intval($_POST['destid']);
$amount = floatval($_POST['amount']);
$charge = floatval($_POST['charge']);
$trdate = strtotime($_POST['date']);
$comment = mysql_real_escape_string($_POST['comm']);

if (!$src_id || !$dest_id || $amount == 0.0 || $charge == 0.0 || $trdate == -1)
	fail();


$query = "SELECT id FROM accounts WHERE id=".$src_id." OR id=".$dest_id.";";
$result = $db->rawQ($query, $dbcnx);
if (mysql_errno() || mysql_num_rows($result) != 2)
	fail();


$query = "INSERT INTO transactions (`id`, `user_id`, `src_id`, `dest_id`, `type`, `amount`, `charge`, `date`, `comment`) ".
			"VALUES (NULL, '".$userid."', '".$src_id."', '".$dest_id."', 3, '".$amount."', '".$charge."', ".$trdate.", '".$comment."');";
$result = $db->rawQ($query, $dbcnx);
if (mysql_errno())
	fail();

$query = "UPDATE accounts SET balance = balance - ".$amount." WHERE id=".$src_id.";";
$result = $db->rawQ($query, $dbcnx);
if (mysql_errno())
	fail();

$query = "UPDATE accounts SET balance = balance + ".$charge." WHERE id=".$dest_id.";";
$result = $db->rawQ($query, $dbcnx);
if (mysql_errno())
	fail();

header("Location: ../index.php?trans=ok");

?>