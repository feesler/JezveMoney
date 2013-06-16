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
		setLocation("../debts.php?debt=fail");
	}


	$userid = User::check();
	if (!$userid)
		setLocation("../login.php");

	$debt_op = (isset($_POST["debtop"])) ? intval($_POST["debtop"]) : 0;
	$person_id = (isset($_POST["personid"])) ? intval($_POST["personid"]) : 0;
	$person_name = $db->escape($_POST["personname"]);
	$acc_id = (isset($_POST["accid"])) ? intval($_POST["accid"]) : 0;
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

	$pers = new Person($userid);
	if (!$person_id)
	{
		$check_id = $pers->findByName($person_name);
		if ($check_id != 0)
			setLocation("../newdebt.php?act=fail&detail=person");
		$person_id = $pers->create($person_name);
	}
	else if (!$pers->is_exist($person_id))
	{
		fail();
	}

	$debt = new Debt($userid);
	if (!$debt->create($debt_op, $acc_id, $person_id, $amount, $charge, $transcurr, $fdate, $comment))
		fail();

	setLocation("../debts.php?debt=ok");
?>