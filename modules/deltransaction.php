<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");
	require_once("../class/transaction.php");


	function fail()
	{
		setLocation("../transactions.php?del=fail");
	}


	$userid = User::check();
	if (!$userid)
		setLocation("../login.php");

	$trans_id = intval($_POST["transid"]);
	if (!$trans_id)
		fail();


	$trans = new Transaction($userid);
	$trans_type = $trans->getType($trans_id);
	if (!$trans->del($trans_id))
		fail();

	$ttStr = Transaction::getTypeString($trans_type);
	if (is_null($ttStr))
		fail();

	setLocation("../transactions.php?type=".$ttStr."&del=ok");

/*
	if ($trans_type == 1)
		setLocation("../transactions.php?type=expense&del=ok");
	else if ($trans_type == 2)
		setLocation("../transactions.php?type=income&del=ok");
	else if ($trans_type == 3)
		setLocation("../transactions.php?type=transfer&del=ok");
*/
?>