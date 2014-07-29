<?php
	require_once("../setup.php");


	function fail($msg = NULL)
	{
		if (!is_null($msg))
			setMessage($msg);
		setMessage(ERR_DEBT_CREATE);
		setLocation("../transactions.php?type=debt");
	}


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("../login.php");

	if (isset($_GET["act"]))
		$action = $_GET["act"];
	if ($action != "new" && $action != "edit")
		fail();

	$defMsg = ($action == "edit") ? ERR_DEBT_UPDATE : ERR_DEBT_CREATE;

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
		fail($defMsg);
	if (!$person_id || $amount == 0.0 || $charge == 0.0 || $trdate == -1)
		fail($defMsg);

	$pers = new Person($user_id);
	if (!$pers->is_exist($person_id))		// person should exist
		fail($defMsg);

	$debt = new Debt($user_id);
	if ($action == "new")
	{
		if (!$debt->create($debt_op, $acc_id, $person_id, $amount, $charge, $transcurr, $fdate, $comment))
			fail($defMsg);
		setMessage(MSG_DEBT_CREATE);
	}
	else if ($action == "edit")
	{
		$trans_id = intval($_POST["transid"]);
		if (!$debt->edit($trans_id, $debt_op, $acc_id, $person_id, $amount, $charge, $transcurr, $fdate, $comment))
			fail($defMsg);
		setMessage(MSG_DEBT_UPDATE);
	}

	setLocation("../transactions.php?type=debt");
?>