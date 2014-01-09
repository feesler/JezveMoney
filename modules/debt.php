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
		setMessage(ERR_DEBT_CREATE);
		setLocation("../transactions.php?type=debt");
	}


	$user_id = User::check();
	if (!$user_id)
		setLocation("../login.php");

	$debt_op = (isset($_POST["debtop"])) ? intval($_POST["debtop"]) : 0;
	$person_id = (isset($_POST["person_id"])) ? intval($_POST["person_id"]) : 0;
	$acc_id = (isset($_POST["acc_id"])) ? intval($_POST["acc_id"]) : 0;
	$amount = floatval($_POST["amount"]);
	$charge = floatval($_POST["charge"]);
	$transcurr = (isset($_POST["transcurr"])) ? intval($_POST["transcurr"]) : 0;
	$trdate = strtotime($_POST["date"]);
	$fdate = date("Y-m-d H:i:s", $trdate);
	$comment = $db->escape($_POST["comm"]);

	if ($debt_op != 1 && $debt_op != 2)
		fail();
	if (!$person_id || $amount == 0.0 || $charge == 0.0 || $trdate == -1)
		fail();

	$pers = new Person($user_id);
	if (!$pers->is_exist($person_id))		// person should exist
		fail();

	$debt = new Debt($user_id);
	if (!$debt->create($debt_op, $acc_id, $person_id, $amount, $charge, $transcurr, $fdate, $comment))
		fail();

	setMessage(MSG_DEBT_CREATE);
	setLocation("../transactions.php?type=debt");
?>