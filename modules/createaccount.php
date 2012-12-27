<?php

require_once("../setup.php");
require_once("../class/user.php");
require_once("../class/currency.php");
require_once("../class/account.php");


function fail()
{
	setLocation("../accounts.php?newacc=fail");
	exit();
}


session_start();

$userid = checkUser("../login.php");


$name = $db->escape($_POST["accname"]);
$balance = floatval($_POST["accbalance"]);
$curr_id = intval($_POST["acccurr"]);

if (!$name || $name == "" || $curr_id == 0)
	fail();

if (!$db->insertQ("accounts", array("id", "user_id", "curr_id", "balance", "initbalance", "name"),
						array(NULL, $userid, $curr_id, $balance, $balance, $name)))
	fail();

setLocation("../accounts.php?newacc=ok");

?>