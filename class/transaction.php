<?php

class Transaction
{
	static private $cache = NULL;
	static private $user_id = 0;


	// Class constructor
	function __construct($user_id)
	{
		if ($user_id != self::$user_id)
			self::$cache = NULL;
		self::$user_id = intval($user_id);
	}


	// Update cache
	private function updateCache($trans_id = 0)
	{
		global $db;

		self::$cache = array();

		$cond = "user_id=".self::$user_id;
		if ($trans_id != 0)
			$cond .= " AND id=".$trans_id;

		$resArr = $db->selectQ("*", "transactions", $cond);
		foreach($resArr as $row)
		{
			$trans_id = intval($row["id"]);

			self::$cache[$trans_id]["user_id"] = intval($row["user_id"]);
			self::$cache[$trans_id]["src_id"] = intval($row["src_id"]);
			self::$cache[$trans_id]["dest_id"] = intval($row["dest_id"]);
			self::$cache[$trans_id]["type"] = intval($row["type"]);
			self::$cache[$trans_id]["amount"] = floatval($row["amount"]);
			self::$cache[$trans_id]["charge"] = floatval($row["charge"]);
			self::$cache[$trans_id]["curr_id"] = intval($row["curr_id"]);
			self::$cache[$trans_id]["date"] = $row["date"];
			self::$cache[$trans_id]["comment"] = $row["comment"];
			self::$cache[$trans_id]["pos"] = intval($row["pos"]);
		}
	}


	// Check state of cache and update if needed
	private function checkCache($trans_id = 0)
	{
		if (is_null(self::$cache))
			$this->updateCache($trans_id);

		return (!is_null(self::$cache));
	}


	// Return value of specified transaction from cache
	private function getCache($trans_id, $val)
	{
		$trans_id = intval($trans_id);
		if (!$trans_id || is_null($val) || $val == "")
			return NULL;

		if (!$this->checkCache($trans_id))
			return NULL;

		if (!isset(self::$cache[$trans_id]))
			return NULL;

		return self::$cache[$trans_id][$val];
	}


	// Check transaction is exist for current user
	public function is_exist($trans_id)
	{
		global $db;

		$trans_id = intval($trans_id);
		if (!$trans_id)
			return FALSE;

		if (!$this->checkCache($trans_id))
			return FALSE;

		return (isset(self::$cache) && isset(self::$cache[$trans_id]));
	}


	// Cancel changes of transaction
	public function cancel($trans_id)
	{
		global $db;

		// check transaction is exist
		if (!$this->is_exist($trans_id))
			return FALSE;

		$transUser = $this->getCache($trans_id, "user_id");
		$src_id = $this->getCache($trans_id, "src_id");
		$dest_id = $this->getCache($trans_id, "dest_id");
		$transType = $this->getCache($trans_id, "type");
		$transAmount = $this->getCache($trans_id, "amount");
		$transCharge = $this->getCache($trans_id, "charge");

		// check type of transaction
		if ($transType != 1 && $transType != 2 && $transType != 3)
			return FALSE;

		// check user is the same
		if ($transUser != self::$user_id)
			return FALSE;

		$acc = new Account(self::$user_id);

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
		}

		// update balance of source account
		if ($transType == 1 || $transType == 3)		// spend or transfer
		{
			$srcBalance += $transCharge;
			if (!$acc->setBalance($src_id, $srcBalance))
				return FALSE;
		}

		// update balance of destination account
		if ($transType == 2 || $transType == 3)		// income or transfer
		{
			$destBalance -= ($transType == 2) ? $transCharge : $transAmount;
			if (!$acc->setBalance($dest_id, $destBalance))
				return FALSE;
		}

/*
		if ($transType == 1)		// spend
		{
			// update balance of account
			$srcBalance += $transCharge;

			if (!$acc->setBalance($src_id, $srcBalance))
				return FALSE;
		}
		else if ($transType == 2)		// income
		{
			// update balance of account
			$destBalance -= $transCharge;
			if (!$acc->setBalance($dest_id, $destBalance))
				return FALSE;
		}
		else if ($transType == 3)		// transfer
		{
			// update balance of source account
			$srcBalance += $transCharge;
			if (!$acc->setBalance($src_id, $srcBalance))
				return FALSE;

			// update balance of destination account
			$destBalance -= $transAmount;
			if (!$acc->setBalance($dest_id, $destBalance))
				return FALSE;
		}
		else
			return FALSE;
*/

		self::updateCache($trans_id);

		return TRUE;
	}


	// Update specified transaction
	public function edit($trans_id, $trans_type, $src_id, $dest_id, $amount, $charge, $transcurr, $trans_date, $comment)
	{
		global $db;

		if (!$trans_id || ($trans_type != 1 && $trans_type != 2 && $trans_type != 3) || (!$src_id && !$dest_id) || $amount == 0.0 || $charge == 0.0 || $trans_date == -1)
			return FALSE;

		// cancel transaction
		if (!$this->cancel($trans_id))
			return FALSE;

		$acc = new Account(self::$user_id);

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
		$trans_curr_id = $transcurr;
		if ($dest_id != 0)
		{
			if (!$acc->is_exist($dest_id))
				return FALSE;

			$destBalance = $acc->getBalance($dest_id);
			$trans_curr_id = $acc->getCurrency($dest_id);		// currency of destination account is currency of transfer transaction
		}

		if (!$trans_curr_id)
			return FALSE;

		$fieldsArr = array("src_id", "dest_id", "type", "amount", "charge", "curr_id", "date", "comment");
		$valuesArr = array($src_id, $dest_id, $trans_type, $amount, $charge, $trans_curr_id, $trans_date, $comment);

		if (!$db->updateQ("transactions", $fieldsArr, $valuesArr, "id=".$trans_id))
			return FALSE;

		// update balance of source account
		if ($trans_type == 1 || $trans_type == 3)		// spend or transfer
		{
			$srcBalance -= $charge;
			if (!$acc->setBalance($src_id, $srcBalance))
				return FALSE;
		}

		// update balance of destination account
		if ($trans_type == 2 || $trans_type == 3)		// income or transfer
		{
			$destBalance += (($trans_type == 2) ? $charge : $amount);
			if (!$acc->setBalance($dest_id, $destBalance))
				return FALSE;
		}

		return TRUE;
	}


	// Update position of specified transaction and fix position of 
	function updatePos($trans_id, $new_pos)
	{
		global $db;

		$trans_id = intval($trans_id);
		$new_pos = intval($new_pos);
		if (!$trans_id || !$new_pos)
			return FALSE;

		self::updateCache($trans_id);

		$old_pos = self::$cache[$trans_id]["pos"];
		$user_id = self::$cache[$trans_id]["user_id"];
		if ($old_pos == $new_pos)
		{
			return TRUE;
		}
		else if ($old_pos == 0)			// insert with specified position
		{
			$latest = $this->getLatestPos();

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


	// Delete specified transaction
	public static function del($trans_id)
	{
		global $db;

		// check transaction is exist
		if (!$this->is_exist($trans_id))
			return FALSE;

		// cancel transaction
		if (!$this->cancel($trans_id))
			return FALSE;

		// delete transaction record
		if (!$db->deleteQ("transactions", "id=".$trans_id))
			return FALSE;

		return TRUE;
	}


	// Return latest position of user transactions
	public function getLatestPos()
	{
		global $db;

		if (!self::$user_id)
			return 0;

		$resArr = $db->selectQ("pos", "transactions", "user_id=".self::$user_id, NULL, "pos DESC LIMIT 1");
		if (count($resArr) != 1)
			return 0;

		return intval($resArr[0]["pos"]);
	}


	// Return string for specified transaction type
	public static function getTypeString($trans_type)
	{
		if ($trans_type == 1)
			return "expense";
		else if ($trans_type == 2)
			return "income";
		else if ($trans_type == 3)
			return "transfer";
		else
			return NULL;
	}
}

?>