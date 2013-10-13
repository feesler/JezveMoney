<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");
	require_once("../class/transaction.php");
	require_once("../class/person.php");
	require_once("../class/debt.php");


	function fail()
	{
		setLocation("../transactions.php?type=debt&act=fail");
	}


	$user_id = User::check();
	if (!$user_id)
		setLocation("../login.php");

	$trans_id = intval($_POST["transid"]);
	$debt_op = (isset($_POST["debtop"])) ? intval($_POST["debtop"]) : 0;
	$person_id = (isset($_POST["person_id"])) ? intval($_POST["person_id"]) : 0;
	$person_name = $db->escape($_POST["personname"]);
	$acc_id = (isset($_POST["acc_id"])) ? intval($_POST["acc_id"]) : 0;
	$amount = floatval($_POST["amount"]);
	$charge = floatval($_POST["charge"]);
	$transcurr = (isset($_POST["transcurr"])) ? intval($_POST["transcurr"]) : 0;
	$trdate = strtotime($_POST["date"]);
	$fdate = date("Y-m-d H:i:s", $trdate);
	$comment = $db->escape($_POST["comm"]);

	if ($debt_op != 1 && $debt_op != 2)
		fail();
	if ($amount == 0.0 || $charge == 0.0 || $trdate == -1 || $person_name == "")
		fail();

	$pers = new Person($user_id);
	if (!$person_id)		// id is zero, name specified: new person sent
	{
		$check_id = $pers->findByName($person_name);
		if ($check_id != 0)
			setLocation("../editdebt.php?act=fail&detail=person");
		$person_id = $pers->create($person_name);
	}
	else if (!$pers->is_exist($person_id))		// id specified: person should exist
	{
		fail();
	}

	$debt = new Debt($user_id);
	if (!$debt->edit($trans_id, $debt_op, $acc_id, $person_id, $amount, $charge, $transcurr, $fdate, $comment))
		fail();

	setLocation("../transactions.php?type=debt&act=ok");
?>