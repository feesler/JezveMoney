<?php

class Transaction extends CachedTable
{
	static private $dcache = NULL;
	static private $user_id = 0;


	// Class constructor
	public function __construct($user_id)
	{
		if ($user_id != self::$user_id)
			self::$dcache = NULL;
		self::$user_id = intval($user_id);
	}


	// Return link to cache of derived class
	protected function &getDerivedCache()
	{
		return self::$dcache;
	}


	// Update cache
	protected function updateCache($trans_id = 0)
	{
		global $db;

		$cond = "user_id=".self::$user_id;
		if ($trans_id != 0)
			$cond .= " AND id=".$trans_id;
		// create empty cache array if needed
		if ($trans_id == 0 || is_null(self::$dcache))
			self::$dcache = array();

		$resArr = $db->selectQ("*", "transactions", $cond);
		if (!count($resArr))		// delete transaction from cache if can't find it
		{
			unset(self::$dcache[$trans_id]);
		}
		else
		{
			foreach($resArr as $row)
			{
				$trans_id = intval($row["id"]);

				self::$dcache[$trans_id]["user_id"] = intval($row["user_id"]);
				self::$dcache[$trans_id]["src_id"] = intval($row["src_id"]);
				self::$dcache[$trans_id]["dest_id"] = intval($row["dest_id"]);
				self::$dcache[$trans_id]["type"] = intval($row["type"]);
				self::$dcache[$trans_id]["amount"] = floatval($row["amount"]);
				self::$dcache[$trans_id]["charge"] = floatval($row["charge"]);
				self::$dcache[$trans_id]["curr_id"] = intval($row["curr_id"]);
				self::$dcache[$trans_id]["date"] = $row["date"];
				self::$dcache[$trans_id]["comment"] = $row["comment"];
				self::$dcache[$trans_id]["pos"] = intval($row["pos"]);
			}
		}
	}


	// Create new transaction
	public function create($trans_type, $src_id, $dest_id, $amount, $charge, $transcurr, $trans_date, $comment)
	{
		global $db;

		if (!is_numeric($trans_type) || !is_numeric($src_id) || !is_numeric($dest_id) || !is_numeric($transcurr))
			return FALSE;

		if (($trans_type != 1 && $trans_type != 2 && $trans_type != 3 && $trans_type != 4) ||
			(!$src_id && !$dest_id) || $amount == 0.0 || $charge == 0.0 || $trdate == -1)
			return FALSE;

		$acc = new Account(self::$user_id, TRUE);
		$u = new User();

		if ($src_id != 0)
		{
			if (!$acc->is_exist($src_id))
				return FALSE;
			$srcBalance = $acc->getBalance($src_id);
		}

		$trans_curr_id = $transcurr;
		if ($dest_id != 0)
		{
			if (!$acc->is_exist($dest_id))
				return FALSE;
			$destBalance = $acc->getBalance($dest_id);
			if ($trans_type == 3 || ($trans_type == 4 && $acc->getOwner($dest_id) != $u->getOwner(self::$user_id)))
				$trans_curr_id = $acc->getCurrency($dest_id);		// currency of destination account is currency of transfer transaction
		}


		// check target date is today
		$today_date = getdate();
		$target_date = getdate(strtotime($trans_date));

		if (mktime(0, 0, 0, $today_date["mon"], $today_date["mday"], $today_date["year"]) > mktime(0, 0, 0, $target_date["mon"], $target_date["mday"], $target_date["year"]))
		{
			$tr_pos = 0;
		}
		else
		{
			$tr_pos = $this->getLatestPos();
			$tr_pos++;
		}

		if (!$db->insertQ("transactions", array("id", "user_id", "src_id", "dest_id", "type", "amount", "charge", "curr_id", "date", "comment", "pos"),
									array(NULL, self::$user_id, $src_id, $dest_id, $trans_type, $amount, $charge, $trans_curr_id, $trans_date, $comment, $tr_pos)))
			return FALSE;

		$trans_id = $db->insertId();

		// update balance of source account
		if ($src_id != 0 && ($trans_type == 1 || $trans_type == 3 || $trans_type == 4))
		{
			if ($trans_type == 4 && ($acc->getOwner($src_id) != $u->getOwner(self::$user_id)))		// person give to us
				$srcBalance -= $amount;
			else
				$srcBalance -= $charge;
			if (!$acc->setBalance($src_id, $srcBalance))
				return FALSE;
		}

		// update balance of destination account
		if ($dest_id != 0 && ($trans_type == 2 || $trans_type == 3 || $trans_type == 4))
		{
			if (($trans_type == 2) || ($trans_type == 4 && ($acc->getOwner($src_id) != $u->getOwner(self::$user_id))))		// income or person give to us
				$destBalance += $charge;
			else
				$destBalance += $amount;
			if (!$acc->setBalance($dest_id, $destBalance))
				return FALSE;
		}

		// update position of transaction if target date is not today
		if ($tr_pos == 0)
		{
			$latest_pos = $this->getLatestPos($trans_date);

			$this->updatePos($trans_id, $latest_pos + 1);
		}

		$this->cleanCache();

		return TRUE;
	}


	// Cancel changes of transaction
	public function cancel($trans_id)
	{
		global $db;

		// check transaction is exist
		if (!$this->is_exist($trans_id))
			return FALSE;

		$transUser = $this->getUser($trans_id);
		$src_id = $this->getSource($trans_id);
		$dest_id = $this->getDest($trans_id);
		$transType = $this->getType($trans_id);
		$transAmount = $this->getAmount($trans_id);
		$transCharge = $this->getCharge($trans_id);
		$transCurr = $this->getCurrency($trans_id);

		// check type of transaction
		if ($transType != 1 && $transType != 2 && $transType != 3 && $transType != 4)
			return FALSE;

		// check user is the same
		if ($transUser != self::$user_id)
			return FALSE;

		$acc = new Account(self::$user_id, TRUE);
		$u = new User();

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
		$trans_curr_id = $transCurr;
		if ($dest_id != 0)
		{
			if (!$acc->is_exist($dest_id))
				return FALSE;

			$destBalance = $acc->getBalance($dest_id);
			if ($transType == 3 || ($transType == 4 && $acc->getOwner($dest_id) != $u->getOwner(self::$user_id)))
				$trans_curr_id = $acc->getCurrency($dest_id);		// currency of destination account is currency of transfer transaction
		}

		if (!$trans_curr_id)
			return FALSE;

		// update balance of source account
		if ($src_id != 0 && ($transType == 1 || $transType == 3 || $transType == 4))		// spend, transfer or debt
		{
			if ($transType == 4 && ($acc->getOwner($src_id) != $u->getOwner(self::$user_id)))		// person give to us
				$srcBalance += $transAmount;
			else
				$srcBalance += $transCharge;

			if (!$acc->setBalance($src_id, $srcBalance))
				return FALSE;
		}

		// update balance of destination account
		if ($dest_id != 0 && ($transType == 2 || $transType == 3 || $transType == 4))		// income, transfer or debt
		{
			if (($transType == 2) || ($transType == 4 && ($acc->getOwner($src_id) != $u->getOwner(self::$user_id))))		// income or person give to us
				$destBalance -= $transCharge;
			else
				$destBalance -= $transAmount;

			if (!$acc->setBalance($dest_id, $destBalance))
				return FALSE;
		}

		$this->cleanCache();

		return TRUE;
	}


	// Update specified transaction
	public function edit($trans_id, $trans_type, $src_id, $dest_id, $amount, $charge, $transcurr, $trans_date, $comment)
	{
		global $db;

		if (!$trans_id || ($trans_type != 1 && $trans_type != 2 && $trans_type != 3 && $trans_type != 4) || (!$src_id && !$dest_id) || $amount == 0.0 || $charge == 0.0 || $trans_date == -1)
			return FALSE;

		// cancel transaction
		if (!$this->cancel($trans_id))
			return FALSE;

		$acc = new Account(self::$user_id, TRUE);
		$u = new User();

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
			if ($trans_type == 3 || ($trans_type == 4 && $acc->getOwner($dest_id) != $u->getOwner(self::$user_id)))
				$trans_curr_id = $acc->getCurrency($dest_id);		// currency of destination account is currency of transfer transaction
		}

		if (!$trans_curr_id)
			return FALSE;

		// check date is changed
		$orig_date = getdate(strtotime($this->getDate($trans_id)));
		$target_date = getdate(strtotime($trans_date));

		$orig_time = mktime(0, 0, 0, $orig_date["mon"], $orig_date["mday"], $orig_date["year"]);
		$target_time = mktime(0, 0, 0, $target_date["mon"], $target_date["mday"], $target_date["year"]);

		if ($orig_time != $target_time)
		{
			$tr_pos = 0;
		}
		else
		{
			$tr_pos = $this->getPos($trans_id);
		}

		$fieldsArr = array("src_id", "dest_id", "type", "amount", "charge", "curr_id", "date", "comment", "pos");
		$valuesArr = array($src_id, $dest_id, $trans_type, $amount, $charge, $trans_curr_id, $trans_date, $comment, $tr_pos);

		if (!$db->updateQ("transactions", $fieldsArr, $valuesArr, "id=".$trans_id))
			return FALSE;

		// update balance of source account
		if ($src_id != 0 && ($trans_type == 1 || $trans_type == 3 || $trans_type == 4))				// spend, transfer or debt
		{
			if ($trans_type == 4 && ($acc->getOwner($src_id) != $u->getOwner(self::$user_id)))		// person give to us
				$srcBalance -= $amount;
			else
				$srcBalance -= $charge;

			if (!$acc->setBalance($src_id, $srcBalance))
				return FALSE;
		}

		// update balance of destination account
		if ($dest_id != 0 && ($trans_type == 2 || $trans_type == 3 || $trans_type == 4))		// income, transfer or debt
		{
			if (($trans_type == 2) || ($trans_type == 4 && ($acc->getOwner($src_id) != $u->getOwner(self::$user_id))))		// income or person give to us
				$destBalance += $charge;
			else
				$destBalance += $amount;

			if (!$acc->setBalance($dest_id, $destBalance))
				return FALSE;
		}

		// update position of transaction if target date is not today
		if ($tr_pos == 0)
		{
			$latest_pos = $this->getLatestPos($trans_date);

			$this->updatePos($trans_id, $latest_pos + 1);
		}

		$this->cleanCache();

		return TRUE;
	}


	// Check is transaction with specified position exist
	public function isPosExist($trans_pos)
	{
		global $db;

		$tr_pos = intval($trans_pos);

		if (!$this->checkCache())
			return FALSE;

		foreach(self::$dcache as $tr_id => $row)
		{
			if ($row["pos"] == $tr_pos)
				return TRUE;
		}

		return FALSE;
	}


	// Update position of specified transaction and fix position of 
	public function updatePos($trans_id, $new_pos)
	{
		global $db;

		$trans_id = intval($trans_id);
		$new_pos = intval($new_pos);
		if (!$trans_id || !$new_pos)
			return FALSE;

		$old_pos = $this->getPos($trans_id);
		$user_id = $this->getUser($trans_id);

		$condition = "user_id=".$user_id;

		if ($old_pos == $new_pos)
		{
			return TRUE;
		}
		else if ($this->isPosExist($new_pos))
		{
			if ($old_pos == 0)			// insert with specified position
			{
				$latest = $this->getLatestPos();

				$condition .= " AND pos >= ".$new_pos." AND pos <= ".$latest;
				$assignment = "pos=pos+1";
			}
			else if ($new_pos < $old_pos)		// moving up
			{
				$condition .= " AND pos >= ".$new_pos." AND pos < ".$old_pos;
				$assignment = "pos=pos+1";
			}
			else if ($new_pos > $old_pos)		// moving down
			{
				$condition .= " AND pos > ".$old_pos." AND pos <= ".$new_pos;
				$assignment = "pos=pos-1";
			}

			$query = "UPDATE `transactions` SET ".$assignment." WHERE ".$condition.";";
			$db->rawQ($query);
			if (mysql_errno() != 0)
				return FALSE;
		}

		if (!$db->updateQ("transactions", array("pos"), array($new_pos), "id=".$trans_id))
			return FALSE;

		$this->cleanCache();

		return TRUE;
	}


	// Delete specified transaction
	public function del($trans_id)
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

		$this->cleanCache();

		return TRUE;
	}


	// Return latest position of user transactions
	public function getLatestPos($trans_date = -1)
	{
		global $db;

		if (!self::$user_id)
			return 0;

		$condition = "user_id=".self::$user_id;
		if ($trans_date != -1)
			$condition .= " AND date <= ".qnull($trans_date);

		$resArr = $db->selectQ("pos", "transactions", $condition, NULL, "pos DESC LIMIT 1");
		if (count($resArr) != 1)
			return 0;

		return intval($resArr[0]["pos"]);
	}


	// Remove specified account from transactions
	public function onAccountDelete($acc_id)
	{
		global $db;

		if (!self::$user_id)
			return FALSE;

		$condition = "user_id=".self::$user_id;

		// delete expenses and incomes
		if (!$db->deleteQ("transactions", $condition." AND ((src_id=".$acc_id." AND type=1) OR (dest_id=".$acc_id." AND type=2))"))
			return FALSE;

		$this->cleanCache();

/*
		// delete debts
		if (!$db->deleteQ("transactions", $condition." AND (src_id=".$acc_id." OR dest_id=".$acc_id.") AND type=4"))
			return FALSE;
*/

		// set transfer from or outgoing debt as income to destination account
		if (!$db->updateQ("transactions", array("src_id", "type"), array(0, 2),
						$condition." AND src_id=".$acc_id." AND (type=3 OR type=4)"))
			return FALSE;

		// set transfer to as expense from source account
		if (!$db->updateQ("transactions", array("dest_id", "type"), array(0, 1),
						$condition." AND dest_id=".$acc_id." AND (type=3 OR type=4)"))
			return FALSE;

		return TRUE;
	}



	// Return array of transactions
	public function getArray($trans_type, $account_id = 0, $isDesc = FALSE, $tr_on_page = 0, $page_num = 0, $searchStr = NULL, $startDate = NULL, $endDate = NULL, $details = FALSE)
	{
		global $db;

		$res = array();

		if (!self::$user_id)
			return $res;

		$u = new User();
		$owner_id = $u->getOwner(self::$user_id);
		if (!$owner_id)
			return $res;

		$pers = new Person(self::$user_id);
		$acc = new Account(self::$user_id, TRUE);
		$accounts = $acc->getCount();
		if (!$accounts)
			return $res;

		if (!$db->countQ("transactions", "user_id=".self::$user_id))
			return $res;

		$tr_type = intval($trans_type);
		$acc_id = intval($account_id);
		$sReq = $db->escape($searchStr);

		$condition = "user_id=".self::$user_id;
		if ($tr_type != 0)
			$condition .= " AND type=".$tr_type;
		if ($acc_id != 0)
			$condition .= " AND (src_id=".$acc_id." OR dest_id=".$acc_id.")";
		if (!is_empty($sReq))
			$condition .= " AND comment LIKE '%".$sReq."%'";

		if (!is_null($startDate) && !is_null($endDate))
		{
			$stdate = strtotime($startDate);
			$enddate = strtotime($endDate);
			if ($stdate != -1 && $enddate != -1)
			{
				$fstdate = date("Y-m-d H:i:s", $stdate);
				$fenddate = date("Y-m-d H:i:s", $enddate);

				$condition .= " AND date >= ".qnull($fstdate)." AND date <= ".qnull($fenddate);
			}
		}

		$orderAndLimit = "pos ".(($isDesc == TRUE) ? "DESC" : "ASC");
		if ($tr_on_page > 0)
		{
			$transCount = $db->countQ("transactions", $condition);

			$limitOffset = ($tr_on_page * $page_num);
			$limitRows = min($transCount - $limitOffset, $tr_on_page);

			$orderAndLimit .= " LIMIT ".$limitOffset.", ".$limitRows;
		}

		$resArr = $db->selectQ("*", "transactions", $condition, NULL, $orderAndLimit);
		$rowCount = count($resArr);
		if (!$rowCount)
			return $res;

		foreach($resArr as $row)
		{
			$trans_id = intval($row["id"]);
			$cur_trans_type = intval($row["type"]);
			$src_id = intval($row["src_id"]);
			$dest_id = intval($row["dest_id"]);
			$amount = floatval($row["amount"]);
			$charge = floatval($row["charge"]);
			$curr_id = intval($row["curr_id"]);
			$comment = $row["comment"];
			$fdate = date("d.m.Y", strtotime($row["date"]));
			$trans_pos = intval($row["pos"]);

			$src_curr = ($src_id != 0) ? $acc->getCurrency($src_id) : 0;
			$dest_curr = ($dest_id != 0) ? $acc->getCurrency($dest_id) : 0;

			if ($cur_trans_type == 4)
			{
				$src_owner_id = ($src_id != 0) ? $acc->getOwner($src_id) : 0;
				$dest_owner_id = ($dest_id != 0) ? $acc->getOwner($dest_id) : 0;
			}

			$famount = "";
			if ($cur_trans_type == 1 || ($cur_trans_type == 4 && ($dest_owner_id == 0 || $src_owner_id == $owner_id)))			// expense
				$famount .= "- ";
			else if ($cur_trans_type == 2 || ($cur_trans_type == 4 && ($src_owner_id == 0 || $dest_owner_id == $owner_id)))			// income
				$famount .= "+ ";
			$famount .= Currency::format($amount, $curr_id);

			if (($src_id != 0 && $dest_id != 0 && $src_curr != $dest_curr) ||
				($src_id == 0 && $dest_id != 0 && $dest_curr != $curr_id) ||
				($src_id != 0 && $dest_id == 0 && $src_curr != $curr_id))
			{
				if ($cur_trans_type == 2 || ($cur_trans_type == 4 && $dest_owner_id == $owner_id))
					$acc_curr = $dest_curr;
				else
					$acc_curr = $src_curr;

				$fcharge = "";
				if ($cur_trans_type == 1 || ($cur_trans_type == 4 && $src_owner_id == $owner_id))			// expense
					$fcharge .= "- ";
				else if ($cur_trans_type == 2 || ($cur_trans_type == 4 && $dest_owner_id == $owner_id))			// income
					$fcharge .= "+ ";
				$fcharge .= Currency::format($charge, $acc_curr);
			}
			else
				$fcharge = $famount;

			$trArr = array($trans_id, $src_id, $dest_id, $famount, $fcharge, $cur_trans_type, $fdate, $comment, $trans_pos);
			if ($details)
			{
				$balArr = $this->getBalance($trans_id);

				$trArr[] = (($src_id != 0 && isset($balArr[$src_id])) ? $balArr[$src_id] : 0.0);
				$trArr[] = (($dest_id != 0 && isset($balArr[$dest_id])) ? $balArr[$dest_id] : 0.0);
			}
			$trArr[] = ($cur_trans_type == 4) ? (($dest_owner_id == 0 || $dest_owner_id == $owner_id) ? 1 : 2) : 0;
			$trArr[] = $amount;
			$trArr[] = $charge;
			$trArr[] = $curr_id;
			$res[] = $trArr;
		}

		return $res;
	}


	// Return total count of transactions for specified condition
	public function getTransCount($trans_type, $account_id = 0, $searchStr = NULL, $startDate = NULL, $endDate = NULL)
	{
		global $db;

		if (!self::$user_id)
			return 0;

		$tr_type = intval($trans_type);
		$acc_id = intval($account_id);
		$sReq = $db->escape($searchStr);

		$condition = "user_id=".self::$user_id;
		if ($tr_type != 0)
			$condition .= " AND type=".$tr_type;
		if ($acc_id != 0)
			$condition .= " AND (src_id=".$acc_id." OR dest_id=".$acc_id.")";
		if (!is_empty($sReq))
			$condition .= " AND comment LIKE '%".$sReq."%'";

		if (!is_null($startDate) && !is_null($endDate))
		{
			$stdate = strtotime($startDate);
			$enddate = strtotime($endDate);
			if ($stdate != -1 && $enddate != -1)
			{
				$fstdate = date("Y-m-d H:i:s", $stdate);
				$fenddate = date("Y-m-d H:i:s", $enddate);

				$condition .= " AND date >= ".qnull($fstdate)." AND date <= ".qnull($fenddate);
			}
		}

		return $db->countQ("transactions", $condition);
	}


	// Return link to specified page
	public function getPageLink($trans_type, $acc_id, $page_num, $searchStr, $startDate, $endDate, $details)
	{
		$params = array("type" => $this->getTypeString($trans_type),
						"page" => $page_num);
		if ($acc_id != 0)
			$params["acc_id"] = $acc_id;
		if ($details == TRUE)
			$params["mode"] = "details";
		if (!is_empty($searchStr))
			$params["search"] = $searchStr;
		if (!is_empty($startDate) && !is_empty($endDate))
		{
			$params["stdate"] = $startDate;
			$params["enddate"] = $endDate;
		}
		$linkStr = urlJoin("./transactions.php", $params);

		return $linkStr;
	}


	// Return array of paginetor items
	public function getPaginatorArray($page_num, $pages_count)
	{
		$res = array();

		$breakLimit = 5;
		$groupLimit = 3;

		if ($pages_count > $breakLimit)
		{
			if ($page_num < $groupLimit)		// 1 2 3 4 5 ... 18
			{
				for($i = 0; $i < $breakLimit; $i++)
				{
					$res[] = array("text" => ($i + 1), "active" => ($i == $page_num));
				}
				$res[] = array("text" => "...");
				$res[] = array("text" => $pages_count, "active" => FALSE);
			}
			else if ($page_num >= $groupLimit && $page_num < $pages_count - $groupLimit)		// 1 ... 14 15 16 ... 18
			{
				$res[] = array("text" => 1, "active" => FALSE);
				$res[] = array("text" => "...");
				for($i = $page_num - ($groupLimit - 2); $i <= $page_num + ($groupLimit - 2); $i++)
				{
					$res[] = array("text" => ($i + 1), "active" => ($i == $page_num));
				}
				$res[] = array("text" => "...");
				$res[] = array("text" => $pages_count, "active" => FALSE);
			}
			else if ($page_num > $groupLimit && $page_num >= $pages_count - $groupLimit)		// 1 ... 14 15 16 17 18
			{
				$res[] = array("text" => 1, "active" => FALSE);
				$res[] = array("text" => "...");
				for($i = $pages_count - ($breakLimit); $i < $pages_count; $i++)
				{
					$res[] = array("text" => ($i + 1), "active" => ($i == $page_num));
				}
			}
		}
		else		// 1 2 3 4 5
		{
			for($i = 0; $i < $pages_count; $i++)
			{
				$res[] = array("text" => ($i + 1), "active" => ($i == $page_num));
			}
		}

		return $res;
	}


	// Return balance of accounts after specified transaction
	public function getBalance($trans_id)
	{
		global $db;

		if (!self::$user_id)
			return NULL;

		if (!$this->is_exist($trans_id))
			return NULL;

		$src_id = $this->getSource($trans_id);
		$dest_id = $this->getDest($trans_id);
		if (!$src_id && !$dest_id)
			return NULL;

		$acc = new Account(self::$user_id, TRUE);
		$u = new User();

		$balArr = array($src_id => 0, $dest_id => 0);
		$balArr[$src_id] = ($src_id != 0) ? $acc->getInitBalance($src_id) : 0;
		$balArr[$dest_id] = ($dest_id != 0) ? $acc->getInitBalance($dest_id) : 0;

		$condition = "user_id=".self::$user_id;
		$orCond = array();
		if ($src_id != 0)
		{
			$orCond[] = "src_id=".$src_id;
			$orCond[] = "dest_id=".$src_id;
		}
		if ($dest_id != 0)
		{
			$orCond[] = "src_id=".$dest_id;
			$orCond[] = "dest_id=".$dest_id;
		}
		if (count($orCond) > 0)
			$condition .= " AND (".implode(" OR ", $orCond).")";

		$resArr = $db->selectQ("*", "transactions", $condition, NULL, "pos ASC");
		foreach($resArr as $row)
		{
			$tr_id = intval($row["id"]);
			$tr_src_id = intval($row["src_id"]);
			$tr_dest_id = intval($row["dest_id"]);
			$tr_amount = floatval($row["amount"]);
			$tr_charge = floatval($row["charge"]);
			$tr_type = intval($row["type"]);


			if (($src_id != 0 && $tr_src_id == $src_id) || ($dest_id != 0 && $tr_src_id == $dest_id))
			{
				$acc_id = ($tr_src_id == $src_id) ? $src_id : $dest_id;

				if ($tr_type == 1)				// expense
				{
					$balArr[$acc_id] = round($balArr[$acc_id] - $tr_charge, 2);
				}
				else if ($tr_type == 3)			// transfer from
				{
					$balArr[$acc_id] = round($balArr[$acc_id] - $tr_charge, 2);
				}
				else if ($tr_type == 4)			// debt
				{
					if ($acc->getOwner($acc_id) != $u->getOwner(self::$user_id))		// acc_id is account of person
						$balArr[$acc_id] = round($balArr[$acc_id] - $tr_amount, 2);
					else
						$balArr[$acc_id] = round($balArr[$acc_id] - $tr_charge, 2);
				}
			}

			if (($src_id != 0 && $tr_dest_id == $src_id) || ($dest_id != 0 && $tr_dest_id == $dest_id))
			{
				$acc_id = ($tr_dest_id == $src_id) ? $src_id : $dest_id;

				if ($tr_type == 2)				// income
				{
					$balArr[$acc_id] = round($balArr[$acc_id] + $tr_charge, 2);
				}
				else if ($tr_type == 3)			// transfer to
				{
					$balArr[$acc_id] = round($balArr[$acc_id] + $tr_amount, 2);
				}
				else if ($tr_type == 4)			// debt
				{
					if ($acc->getOwner($acc_id) != $u->getOwner(self::$user_id))		// acc_id is account of person
						$balArr[$acc_id] = round($balArr[$acc_id] + $tr_amount, 2);
					else
						$balArr[$acc_id] = round($balArr[$acc_id] + $tr_charge, 2);
				}
			}

			if ($trans_id == $tr_id)
				break;
		}

		return $balArr;
	}


	// Return string for specified transaction type
	public static function getStringType($trans_type)
	{
		if ($trans_type == "all")
			return 0;
		else if ($trans_type == "expense")
			return 1;
		else if ($trans_type == "income")
			return 2;
		else if ($trans_type == "transfer")
			return 3;
		else if ($trans_type == "debt")
			return 4;
		else
			return 0;
	}


	// Return string for specified transaction type
	public static function getTypeString($trans_type)
	{
		if ($trans_type == 0)
			return "all";
		else if ($trans_type == 1)
			return "expense";
		else if ($trans_type == 2)
			return "income";
		else if ($trans_type == 3)
			return "transfer";
		else if ($trans_type == 4)
			return "debt";
		else
			return NULL;
	}


	// Return user id of transaction
	public function getUser($trans_id)
	{
		return $this->getCache($trans_id, "user_id");
	}


	// Return source account of transaction
	public function getSource($trans_id)
	{
		return $this->getCache($trans_id, "src_id");
	}


	// Return destination account of transaction
	public function getDest($trans_id)
	{
		return $this->getCache($trans_id, "dest_id");
	}


	// Return type of transaction
	public function getType($trans_id)
	{
		return $this->getCache($trans_id, "type");
	}


	// Return amount of transaction
	public function getAmount($trans_id)
	{
		return $this->getCache($trans_id, "amount");
	}


	// Return charge of transaction
	public function getCharge($trans_id)
	{
		return $this->getCache($trans_id, "charge");
	}


	// Return currency of transaction
	public function getCurrency($trans_id)
	{
		return $this->getCache($trans_id, "curr_id");
	}


	// Return date of transaction
	public function getDate($trans_id)
	{
		return $this->getCache($trans_id, "date");
	}


	// Return comment of transaction
	public function getComment($trans_id)
	{
		return $this->getCache($trans_id, "comment");
	}


	// Return position of transaction
	public function getPos($trans_id)
	{
		return $this->getCache($trans_id, "pos");
	}
}

?>