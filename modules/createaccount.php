<?php

require_once("../setup.php");


function fail()
{
	header("Location: ../accounts.php?newacc=fail");
	exit();
}


session_start();

$userid = checkUser('../login.php');


$name = mysql_real_escape_string($_POST['accname']);
$balance = floatval($_POST['accbalance']);
$curr_id = intval($_POST['acccurr']);

if (!$name || $name == "" || $curr_id == 0)
	fail();

if (!$db->insertQ("accounts", array("id", "user_id", "curr_id", "balance", "initbalance", "name"), array(NULL, $userid, $curr_id, $balance, $balance, $name)))
	fail();

/*
$query = "INSERT INTO accounts (`id`, `user_id`, `curr_id`, `balance`, `initbalance`, `name`)";
$query .= " VALUES (NULL, '".$userid."', '".$curr_id."', '".$balance."', '".$balance."', '".$name."');";
$result = $db->rawQ($query, $dbcnx);
if (mysql_errno())
	fail();
*/

header("Location: ../accounts.php?newacc=ok");

?>