<?php
require_once("../setup.php");


function fail()
{
	setLocation("../resetaccounts.php?act=fail");
	exit();
}


session_start();

$userid = checkUser("../login.php");
if (!is_numeric($userid))
	fail();

// delete all transactions of user
if (!$db->deleteQ("transactions", "user_id=".$userid))
	fail();

// delete all accounts of user
if (!$db->deleteQ("accounts", "user_id=".$userid))
	fail();

setLocation("../accounts.php?reset=ok");

?>