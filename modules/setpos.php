<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");


	function fail($acc_id = 0)
	{
		if (!$acc_id)
		{
			echo("fail to update position");
			exit();
		}
		else
			setLocation("../checkbalance.php?id=".$acc_id."&pos=fail");
	}


	function setPos($trans_id, $new_pos)
	{
		global $db;

		$trans_id = intval($trans_id);
		$new_pos = intval($new_pos);
		if (!$trans_id || !$new_pos)
			return FALSE;

		$resArr = $db->selectQ("*", "transactions", "id=".$trans_id);
		if (count($resArr) != 1)
			return FALSE;

		$old_pos = intval($resArr[0]["pos"]);
		$user_id = intval($resArr[0]["user_id"]);
		if ($old_pos == $new_pos)
		{
			return TRUE;
		}
		else if ($old_pos == 0)			// insert with specified position
		{
			$latest = getLatestTransactionPos($user_id);

			$query = "UPDATE `transactions` SET pos=pos+1 WHERE pos >= ".$new_pos." AND pos <= ".$latest.";";

			$db->rawQ($query);
			if (mysql_errno() != 0)
				return FALSE;
		}
		else if ($new_pos < $old_pos)		// moving up
		{
			$query = "UPDATE `transactions` SET pos=pos+1 WHERE pos >= ".$new_pos." AND pos < ".$old_pos.";";

			$db->rawQ($query);
			if (mysql_errno() != 0)
				return FALSE;
		}
		else if ($new_pos > $old_pos)		// moving down
		{
			$query = "UPDATE `transactions` SET pos=pos-1 WHERE pos > ".$old_pos." AND pos <= ".$new_pos.";";

			$db->rawQ($query);
			if (mysql_errno() != 0)
				return FALSE;
		}

		if (!$db->updateQ("transactions", array("pos"), array($new_pos), "id=".$trans_id))
			return FALSE;

		return TRUE;
	}


	session_start();

	$userid = checkUser("./login.php");

	if (!isset($_POST["trans_id"]) || !is_numeric($_POST["trans_id"]) ||
		!isset($_POST["trans_pos"]) || !is_numeric($_POST["trans_pos"]) ||
		!isset($_POST["trans_acc"]) || !is_numeric($_POST["trans_acc"]))
		fail();

	$tr_id = intval($_POST["trans_id"]);
	$to_pos = intval($_POST["trans_pos"]);
	$acc_id = intval($_POST["trans_acc"]);
	if (!$tr_id || !$to_pos || !$acc_id)
		fail();

	if (!setPos($tr_id, $to_pos))
		fail($acc_id);

	setLocation("../checkbalance.php?id=".$acc_id."&pos=ok");
?>