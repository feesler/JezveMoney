<?php


	// Cancel changes of transaction
	function cancelTransaction($trans_id)
	{
		global $db;

		// check transaction is exist
		$transArr = $db->selectQ("*", "transactions", "id=".$trans_id);
		if (count($transArr) != 1)
			return FALSE;

		$trans = $transArr[0];
		$src_id = intval($trans["src_id"]);
		$dest_id = intval($trans["dest_id"]);
		$transType = intval($trans["type"]);
		$transAmount = floatval($trans["amount"]);
		$transCharge = floatval($trans["charge"]);

		// check source account is exist
		$srcBalance = 0;
		if ($src_id != 0)
		{
			$resArr = $db->selectQ("*", "accounts", "id=".$src_id);
			if (count($resArr) != 1)
				return FALSE;
	
			$srcBalance = floatval($resArr[0]["balance"]);
		}

		// check destination account is exist
		$destBalance = 0;
		if ($dest_id != 0)
		{
			$resArr = $db->selectQ("*", "accounts", "id=".$dest_id);
			if (count($resArr) != 1)
				return FALSE;

			$destBalance = floatval($resArr[0]["balance"]);
		}

		if ($transType == 1)		// spend
		{
			// update balance of account
			$srcBalance += $transCharge;
			if (!$db->updateQ("accounts", array("balance"), array($srcBalance), "id=".$src_id))
				fail();
		}
		else if ($transType == 2)		// income
		{
			// update balance of account
			$destBalance -= $transCharge;
			if (!$db->updateQ("accounts", array("balance"), array($destBalance), "id=".$dest_id))
				fail();
		}
		else if ($transType == 3)		// transfer
		{
			// update balance of source account
			$srcBalance += $transCharge;
			if (!$db->updateQ("accounts", array("balance"), array($srcBalance), "id=".$src_id))
				return FALSE;

			// update balance of destination account
			$destBalance -= $transAmount;
			if (!$db->updateQ("accounts", array("balance"), array($destBalance), "id=".$dest_id))
				return FALSE;
		}
		else
			return FALSE;

		return TRUE;
	}


	// Return latest position of user transactions
	function getLatestTransactionPos($user_id)
	{
		global $db;

		$user_id = intval($user_id);
		if (!user_id)
			return 0;

		$resArr = $db->selectQ("pos",
					"transactions",
					"user_id=".$user_id,
					NULL,
					"pos DESC LIMIT 1");

		if (count($resArr) != 1)
			return 0;

		return intval($resArr[0]["pos"]);
	}


?>