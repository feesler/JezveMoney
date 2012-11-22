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
$resArr = $db->selectQ("id", "acounts", "user_id=".$userid);
foreach($resArr as $row)
{
	$acc_id = $row["id"];

	if (!$db->deleteQ("transactions", "src_id=".$acc_id." OR dest_id=".$acc_id))
		fail();
}

// delete all accounts of user
if (!$db->deleteQ("accounts", "user_id=".$userid))
	fail();

setLocation("../accounts.php?reset=ok");

?>