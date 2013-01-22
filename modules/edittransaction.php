<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");
	require_once("../class/transaction.php");


	function fail()
	{
		setLocation("../transactions.php?edit=fail");
	}


	$userid = User::check();
	if (!$userid)
		setLocation("../login.php");

	$trans_id = intval($_POST["transid"]);
	$trans_type = intval($_POST["transtype"]);
	$src_id = intval($_POST["srcid"]);
	$dest_id = intval($_POST["destid"]);
	$amount = floatval($_POST["amount"]);
	$charge = floatval($_POST["charge"]);
	$transcurr = intval($_POST["transcurr"]);
	$trdate = strtotime($_POST["date"]);
	$fdate = date("Y-m-d H:i:s", $trdate);
	$comment = $db->escape($_POST["comm"]);


	$trans = new Transaction($userid);
	if (!$trans->edit($trans_id, $trans_type, $src_id, $dest_id, $amount, $charge, $transcurr, $fdate, $comment))
		fail();

	$ttStr = Transaction::getTypeString($trans_type);
	if (is_null($ttStr))
		fail();

	setLocation("../transactions.php?type=".$ttStr."&edit=ok");

/*
	if (!$trans_id || !$trans_type || (!$src_id && !$dest_id) || $amount == 0.0 || $charge == 0.0 || $trdate == -1)
		fail();


	// cancel transaction
	$trans = new Transaction($userid);
	if (!$trans->cancel($trans_id))
		fail();

	$acc = new Account($userid);

	// check source account is exist
	$srcBalance = 0;
	if ($src_id != 0)
	{
		if (!$acc->is_exist($src_id))
			return FALSE;

		$srcBalance = $acc->getBalance($src_id);
	}

	// check destination account is exist
	$destBalance = 0;
	if ($dest_id != 0)
	{
		if (!$acc->is_exist($dest_id))
			return FALSE;

		$destBalance = $acc->getBalance($dest_id);
		$dest_curr_id = $acc->getCurrency($dest_id);		// currency of destination account is currency of transfer transaction
	}

	if ($trans_type == 1)	// spend
	{
		if (!$db->updateQ("transactions", array("src_id", "dest_id", "type", "amount", "charge", "curr_id", "date", "comment"),
						array($src_id, 0, 1, $amount, $charge, $transcurr, $fdate, $comment), "id=".$trans_id))
			fail();

		$srcBalance -= $charge;
		if (!$acc->setBalance($src_id, $srcBalance))
			fail();

		setLocation("../transactions.php?type=expense&edit=ok");
	}
	else if ($trans_type == 2)	// income
	{
		if (!$db->updateQ("transactions", array("src_id", "dest_id", "type", "amount", "charge", "curr_id", "date", "comment"),
						array(0, $dest_id, 2, $amount, $charge, $transcurr, $fdate, $comment), "id=".$trans_id))
			fail();

		$destBalance += $charge;
		if (!$acc->setBalance($dest_id, $destBalance))
			fail();

		setLocation("../transactions.php?type=income&edit=ok");
	}
	else if ($trans_type == 3)	// transfer
	{
		if (!$db->updateQ("transactions", array("src_id", "dest_id", "type", "amount", "charge", "curr_id", "date", "comment"),
									array($src_id, $dest_id, 3, $amount, $charge, $dest_curr_id, $fdate, $comment), "id=".$trans_id))
			fail();

		$srcBalance -= $charge;
		if (!$acc->setBalance($src_id, $srcBalance))
			fail();

		$destBalance += $amount;
		if (!$acc->setBalance($dest_id, $destBalance))
			fail();

		setLocation("../transactions.php?type=transfer&edit=ok");
	}
	else
		fail();
*/

?>