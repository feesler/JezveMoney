<?php

require_once("../db.php");

session_start();

if (isset($_SESSION["userid"]))
	$userid = $_SESSION["userid"];


$name = mysql_real_escape_string($_POST['accname']);
$balance = floatval($_POST['accbalance']);
$curr_id = intval($_POST['acccurr']);

if ($name && $name != "" && $curr_id != 0)
{
	$query = "INSERT INTO accounts (`id`, `user_id`, `curr_id`, `balance`, `initbalance`, `name`) VALUES (NULL, '".$userid."', '".$curr_id."', '".$balance."', '".$balance."', '".$name."');";
	$result = mysql_query($query, $dbcnx);

	if (!mysql_errno())
	{
		header("Location: ../index.php?newacc=ok");
		exit();
	}
}

header("Location: ../index.php?newacc=fail");

?>