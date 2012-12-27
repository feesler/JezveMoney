<?php

require_once("../setup.php");
require_once("../class/user.php");
require_once("../class/currency.php");
require_once("../class/account.php");

function fail()
{
	setLocation("../transactions.php?del=fail");
	exit();
}


session_start();

$userid = checkUser("../login.php");


$trans_id = intval($_POST["transid"]);
if (!$trans_id)
	fail();


// check transaction is exist
$transArr = $db->selectQ("*", "transactions", "id=".$trans_id);
if (count($transArr) != 1)
	fail();

$trans_type = intval($transArr[0]["type"]);

// cancel transaction
if (!cancelTransaction($trans_id))
	fail();

// delete transaction record
if (!$db->deleteQ("transactions", "id=".$trans_id))
	fail();

if ($trans_type == 1)
	setLocation("../transactions.php?type=expense&del=ok");
else if ($trans_type == 2)
	setLocation("../transactions.php?type=income&del=ok");
else if ($trans_type == 3)
	setLocation("../transactions.php?type=transfer&del=ok");

?>