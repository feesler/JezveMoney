<?php

class Transaction extends CachedTable
{
	static private $dcache = NULL;
	static private $user_id = 0;
	static private $tbl_name = "transactions";
	static private $typeStrArr = array(0 => "all", EXPENSE => "expense", INCOME => "income", TRANSFER => "transfer", DEBT => "debt");


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

		$condArr = array("user_id=".self::$user_id);
		if ($trans_id != 0)
			$condArr[] = "id=".$trans_id;
		// create empty cache array if needed
		if ($trans_id == 0 || is_null(self::$dcache))
			self::$dcache = array();

		$resArr = $db->selectQ("*", self::$tbl_name, $condArr);
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
				self::$dcache[$trans_id]["src_amount"] = floatval($row["src_amount"]);
				self::$dcache[$trans_id]["dest_amount"] = floatval($row["dest_amount"]);
				self::$dcache[$trans_id]["src_curr"] = intval($row["src_curr"]);
				self::$dcache[$trans_id]["dest_curr"] = intval($row["dest_curr"]);
				self::$dcache[$trans_id]["date"] = $row["date"];
				self::$dcache[$trans_id]["comment"] = $row["comment"];
				self::$dcache[$trans_id]["pos"] = intval($row["pos"]);
			}
		}
	}


	// Create new transaction
	public function create($trans_type, $src_id, $dest_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $trans_date, $comment)
	{
		global $db;

		if (!is_numeric($trans_type) || !is_numeric($src_id) || !is_numeric($dest_id) || !is_numeric($src_curr) || !is_numeric($dest_curr))
			return 0;

		$e_comm = $db->escape($comment);

		if (($trans_type != EXPENSE && $trans_type != INCOME && $trans_type != TRANSFER && $trans_type != DEBT) ||
			(!$src_id && !$dest_id) || $src_amount == 0.0 || $dest_amount == 0.0 || $trdate == -1)
			return 0;

		$acc = new Account(self::$user_id, TRUE);
		$u = new User();

		if ($src_id != 0)
		{
			if (!$acc->is_exist($src_id))
				return 0;
			$srcBalance = $acc->getBalance($src_id);
		}

		$trans_curr_id = $transcurr;
		if ($dest_id != 0)
		{
			if (!$acc->is_exist($dest_id))
				return 0;
			$destBalance = $acc->getBalance($dest_id);
			if ($trans_type == TRANSFER || ($trans_type == DEBT && $acc->getOwner($dest_id) != $u->getOwner(self::$user_id)))
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

		if (!$db->insertQ(self::$tbl_name, array("id", "user_id", "src_id", "dest_id", "type", "src_amount", "dest_amount", "src_curr", "dest_curr", "date", "comment", "pos"),
									array(NULL, self::$user_id, $src_id, $dest_id, $trans_type, $src_amount, $dest_amount, $src_curr, $dest_curr, $trans_date, $e_comm, $tr_pos)))
			return 0;

		$trans_id = $db->insertId();

		// update balance of source account
		if ($src_id != 0 && ($trans_type == EXPENSE || $trans_type == TRANSFER || $trans_type == DEBT))
		{
			$srcBalance -= $src_amount;
			if (!$acc->setBalance($src_id, $srcBalance))
				return 0;
		}

		// update balance of destination account
		if ($dest_id != 0 && ($trans_type == INCOME || $trans_type == TRANSFER || $trans_type == DEBT))
		{
			$destBalance += $dest_amount;
			if (!$acc->setBalance($dest_id, $destBalance))
				return 0;
		}

		// update position of transaction if target date is not today
		if ($tr_pos == 0)
		{
			$latest_pos = $this->getLatestPos($trans_date);

			$this->updatePos($trans_id, $latest_pos + 1);
		}

		$this->cleanCache();

		return $trans_id;
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
		$transSrcAmount = $this->getSrcAmount($trans_id);
		$transDestAmount = $this->getDestAmount($trans_id);
		$srcCurr = $this->getSrcCurrency($trans_id);
		$destCurr = $this->getDestCurrency($trans_id);

		// check type of transaction
		if ($transType != EXPENSE && $transType != INCOME && $transType != TRANSFER && $transType != DEBT)
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
		if ($dest_id != 0)
		{
			if (!$acc->is_exist($dest_id))
				return FALSE;

			$destBalance = $acc->getBalance($dest_id);
		}

		// update balance of source account
		if ($src_id != 0 && ($transType == EXPENSE || $transType == TRANSFER || $transType == DEBT))
		{
			$srcBalance += $transSrcAmount;
			if (!$acc->setBalance($src_id, $srcBalance))
				return FALSE;
		}

		// update balance of destination account
		if ($dest_id != 0 && ($transType == INCOME || $transType == TRANSFER || $transType == DEBT))
		{
			$destBalance -= $transDestAmount;
			if (!$acc->setBalance($dest_id, $destBalance))
				return FALSE;
		}

		$this->cleanCache();

		return TRUE;
	}


	// Update specified transaction
	public function edit($trans_id, $trans_type, $src_id, $dest_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $trans_date, $comment)
	{
		global $db;

		if (!$trans_id || ($trans_type != EXPENSE && $trans_type != INCOME && $trans_type != TRANSFER && $trans_type != DEBT) || (!$src_id && !$dest_id) || $src_amount == 0.0 || $dest_amount == 0.0 || $trans_date == -1)
			return FALSE;

		$e_comm = $db->escape($comment);

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
		if ($dest_id != 0)
		{
			if (!$acc->is_exist($dest_id))
				return FALSE;

			$destBalance = $acc->getBalance($dest_id);
		}

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

		$fieldsArr = array("src_id", "dest_id", "type", "src_amount", "dest_amount", "src_curr", "dest_curr", "date", "comment", "pos");
		$valuesArr = array($src_id, $dest_id, $trans_type, $src_amount, $dest_amount, $src_curr, $dest_curr, $trans_date, $e_comm, $tr_pos);

		if (!$db->updateQ(self::$tbl_name, $fieldsArr, $valuesArr, "id=".$trans_id))
			return FALSE;

		$this->cleanCache();

		// update balance of source account
		if ($src_id != 0 && ($trans_type == EXPENSE || $trans_type == TRANSFER || $trans_type == DEBT))
		{
			$srcBalance -= $src_amount;

			if (!$acc->setBalance($src_id, $srcBalance))
				return FALSE;
		}

		// update balance of destination account
		if ($dest_id != 0 && ($trans_type == INCOME || $trans_type == TRANSFER || $trans_type == DEBT))
		{
			$destBalance += $dest_amount;

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

		$condArr = array("user_id=".$user_id);

		if ($old_pos == $new_pos)
		{
			return TRUE;
		}
		else if ($this->isPosExist($new_pos))
		{
			if ($old_pos == 0)			// insert with specified position
			{
				$latest = $this->getLatestPos();

				$condArr[] = "pos >= ".$new_pos;
				$condArr[] = "pos <= ".$latest;
				$assignment = "pos=pos+1";
			}
			else if ($new_pos < $old_pos)		// moving up
			{
				$condArr[] = "pos >= ".$new_pos;
				$condArr[] = "pos < ".$old_pos;
				$assignment = "pos=pos+1";
			}
			else if ($new_pos > $old_pos)		// moving down
			{
				$condArr[] = "pos > ".$old_pos;
				$condArr[] = "pos <= ".$new_pos;
				$assignment = "pos=pos-1";
			}

			$query = "UPDATE `".self::$tbl_name."` SET ".$assignment." WHERE ".andJoin($condArr).";";
			$db->rawQ($query);
			if (mysql_errno() != 0)
				return FALSE;
		}

		if (!$db->updateQ(self::$tbl_name, array("pos"), array($new_pos), "id=".$trans_id))
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
		if (!$db->deleteQ(self::$tbl_name, "id=".$trans_id))
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

		$condArr = array("user_id=".self::$user_id);
		if ($trans_date != -1)
			$condArr[] = "date <= ".qnull($trans_date);

		$resArr = $db->selectQ("pos", self::$tbl_name, $condArr, NULL, "pos DESC LIMIT 1");
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

		$u = new User();
		$acc = new Account(self::$user_id, TRUE);
		if (!$acc->is_exist($acc_id))
			return FALSE;

		$acc_owner = $acc->getOwner($acc_id);
		$u_owner = $u->getOwner(self::$user_id);

		$userCond = "user_id=".self::$user_id;

		// delete expenses and incomes
		$condArr = array($userCond);
		$condArr[] = "((src_id=".$acc_id." AND type=1) OR (dest_id=".$acc_id." AND type=2))";
		if (!$db->deleteQ(self::$tbl_name, $condArr))
			return FALSE;

		$this->cleanCache();

		if ($acc_owner != $u_owner)	// specified account is account of person
		{
			// set outgoing debt(person take) as income to destination account
			$condArr = array($userCond, "src_id=".$acc_id, "type=4");
			if (!$db->updateQ(self::$tbl_name, array("src_id", "type"), array(0, 2),
							$condArr))
				return FALSE;

			// set incoming debt(person give) as expense from source account
			$condArr = array($userCond, "dest_id=".$acc_id, "type=4");
			if (!$db->updateQ(self::$tbl_name, array("dest_id", "type"), array(0, 1),
							$condArr))
				return FALSE;
		}
		else							// specified account is account of user
		{
			// set outgoing debt(person take) as debt without acc
			$condArr = array($userCond, "src_id=".$acc_id, "type=4");
			if (!$db->updateQ(self::$tbl_name, array("src_id", "type"), array(0, 4),
							$condArr))
				return FALSE;

			// set incoming debt(person give) as debt without acc
			$condArr = array($userCond, "dest_id=".$acc_id, "type=4");
			if (!$db->updateQ(self::$tbl_name, array("dest_id", "type"), array(0, 4),
							$condArr))
				return FALSE;
		}

		// set transfer from account as income to destination account
		$condArr = array($userCond, "src_id=".$acc_id, "type=3");
		if (!$db->updateQ(self::$tbl_name, array("src_id", "type"), array(0, 2),
						$condArr))
			return FALSE;

		// set transfer to account as expense from source account
		$condArr = array($userCond, "dest_id=".$acc_id, "type=3");
		if (!$db->updateQ(self::$tbl_name, array("dest_id", "type"), array(0, 1),
						$condArr))
			return FALSE;

		return TRUE;
	}


	// Return condition string for list of accounts
	private function getAccCondition($accounts = NULL)
	{
		if (is_null($accounts))
			return "";

		$accCond = array();
		if (is_array($accounts))
		{
			foreach($accounts as $acc_id)
			{
				$acc_id = intval($acc_id);
				if ($acc_id)
				{
					$accCond[] = "src_id=".$acc_id;
					$accCond[] = "dest_id=".$acc_id;
				}
			}
		}
		else
		{
			$acc_id = intval($accounts);
			if ($acc_id)
			{
				$accCond[] = "src_id=".$acc_id;
				$accCond[] = "dest_id=".$acc_id;
			}
		}

		return orJoin($accCond);
	}


	// Return array of transactions
	public function getArray($trans_type, $accounts = NULL, $isDesc = FALSE, $tr_on_page = 0, $page_num = 0, $searchStr = NULL, $startDate = NULL, $endDate = NULL, $details = FALSE)
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
		if (!$acc->getCount())
			return $res;

		if (!$db->countQ(self::$tbl_name, "user_id=".self::$user_id))
			return $res;

		$tr_type = intval($trans_type);
		$sReq = $db->escape($searchStr);

		$condArr = array();
		$condArr[] = "user_id=".self::$user_id;
		if ($tr_type != 0)
			$condArr[] = "type=".$tr_type;
		if ($accounts != NULL)
		{
			$accCond = $this->getAccCondition($accounts);
			if (!is_empty($accCond))
				$condArr[] = "(".$accCond.")";
		}
		if (!is_empty($sReq))
			$condArr[] = "comment LIKE '%".$sReq."%'";

		if (!is_null($startDate) && !is_null($endDate))
		{
			$stdate = strtotime($startDate);
			$enddate = strtotime($endDate);
			if ($stdate != -1 && $enddate != -1)
			{
				$fstdate = date("Y-m-d H:i:s", $stdate);
				$fenddate = date("Y-m-d H:i:s", $enddate);

				$condArr[] = "date >= ".qnull($fstdate);
				$condArr[] = "date <= ".qnull($fenddate);
			}
		}

		$orderAndLimit = "pos ".(($isDesc == TRUE) ? "DESC" : "ASC");
		if ($tr_on_page > 0)
		{
			$transCount = $db->countQ(self::$tbl_name, $condArr);

			$limitOffset = ($tr_on_page * $page_num);
			$limitRows = min($transCount - $limitOffset, $tr_on_page);

			$orderAndLimit .= " LIMIT ".$limitOffset.", ".$limitRows;
		}

		$resArr = $db->selectQ("*", self::$tbl_name, $condArr, NULL, $orderAndLimit);
		$rowCount = count($resArr);
		if (!$rowCount)
			return $res;

		foreach($resArr as $row)
		{
			$trans = new stdClass;

			$trans->id = intval($row["id"]);
			$trans->type = intval($row["type"]);
			$trans->src_id = intval($row["src_id"]);
			$trans->dest_id = intval($row["dest_id"]);
			$trans->src_amount = floatval($row["src_amount"]);
			$trans->dest_amount = floatval($row["dest_amount"]);
			$trans->src_curr = intval($row["src_curr"]);
			$trans->dest_curr = intval($row["dest_curr"]);
			$trans->comment = $row["comment"];
			$trans->date = date("d.m.Y", strtotime($row["date"]));
			$trans->pos = intval($row["pos"]);

			if ($details)
			{
				$balArr = $this->getBalance($trans->id);

				$trans->src_balance = (($trans->src_id != 0 && isset($balArr[$trans->src_id])) ? $balArr[$trans->src_id] : 0.0);
				$trans->dest_balance = (($trans->dest_id != 0 && isset($balArr[$trans->dest_id])) ? $balArr[$trans->dest_id] : 0.0);
			}

			if ($trans->type == DEBT)
			{
				$src_owner_id = ($trans->src_id != 0) ? $acc->getOwner($trans->src_id) : 0;
				$dest_owner_id = ($trans->dest_id != 0) ? $acc->getOwner($trans->dest_id) : 0;
			}

			$trans->fsrcAmount = "";
			if ($trans->type == EXPENSE || ($trans->type == DEBT && ($dest_owner_id == 0 || $src_owner_id == $owner_id)))			// expense
				$trans->fsrcAmount .= "- ";
			else if ($trans->type == INCOME || ($trans->type == DEBT && ($src_owner_id == 0 || $dest_owner_id == $owner_id)))			// income
				$trans->fsrcAmount .= "+ ";
			$trans->fsrcAmount .= Currency::format($trans->src_amount, $trans->src_curr);

			if ($trans->src_curr != $trans->dest_curr)
			{
				$trans->fdestAmount = "";
				if ($trans->type == EXPENSE || ($trans->type == DEBT && $src_owner_id == $owner_id))			// expense
					$trans->fdestAmount .= "- ";
				else if ($trans->type == INCOME || ($trans->type == DEBT && $dest_owner_id == $owner_id))			// income
					$trans->fdestAmount .= "+ ";
				$trans->fdestAmount .= Currency::format($trans->dest_amount, $trans->dest_curr);
			}
			else
				$trans->fdestAmount = $trans->fsrcAmount;

			$trans->debtType = ($trans->type == DEBT) ? (($dest_owner_id == 0 || $dest_owner_id == $owner_id) ? 1 : 2) : 0;

			$res[] = $trans;
		}

		return $res;
	}


	// Return total count of transactions for specified condition
	public function getTransCount($trans_type, $accounts = NULL, $searchStr = NULL, $startDate = NULL, $endDate = NULL)
	{
		global $db;

		if (!self::$user_id)
			return 0;

		$tr_type = intval($trans_type);
		$acc_id = intval($account_id);
		$sReq = $db->escape($searchStr);

		$condArr = array("user_id=".self::$user_id);
		if ($tr_type != 0)
			$condArr[] = "type=".$tr_type;

		if ($accounts != NULL)
		{
			$accCond = $this->getAccCondition($accounts);
			if (!is_empty($accCond))
				$condArr[] = "(".$accCond.")";
		}

		if (!is_empty($sReq))
			$condArr[] = "comment LIKE '%".$sReq."%'";

		if (!is_null($startDate) && !is_null($endDate))
		{
			$stdate = strtotime($startDate);
			$enddate = strtotime($endDate);
			if ($stdate != -1 && $enddate != -1)
			{
				$fstdate = date("Y-m-d H:i:s", $stdate);
				$fenddate = date("Y-m-d H:i:s", $enddate);

				$condArr[] = "date >= ".qnull($fstdate);
				$condArr[] = "date <= ".qnull($fenddate);
			}
		}

		return $db->countQ(self::$tbl_name, $condArr);
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
		$linkStr = urlJoin(BASEURL."transactions/", $params);

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


	// TODO : cache here
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

		$condArr = array("user_id=".self::$user_id);
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
			$condArr[] = "(".orJoin($orCond).")";

		$resArr = $db->selectQ("*", self::$tbl_name, $condArr, NULL, "pos ASC");
		foreach($resArr as $row)
		{
			$tr_id = intval($row["id"]);
			$tr_src_id = intval($row["src_id"]);
			$tr_dest_id = intval($row["dest_id"]);
			$tr_src_amount = floatval($row["src_amount"]);
			$tr_dest_amount = floatval($row["dest_amount"]);
			$tr_type = intval($row["type"]);


			// Check source account of current transaction
			if (($src_id != 0 && $tr_src_id == $src_id) || ($dest_id != 0 && $tr_src_id == $dest_id))
			{
				$acc_id = ($tr_src_id == $src_id) ? $src_id : $dest_id;

				if ($tr_type == EXPENSE || $tr_type == TRANSFER || $tr_type == DEBT)
				{
					$balArr[$acc_id] = round($balArr[$acc_id] - $tr_src_amount, 2);
				}
			}

			// Check destination account of current transaction
			if (($src_id != 0 && $tr_dest_id == $src_id) || ($dest_id != 0 && $tr_dest_id == $dest_id))
			{
				$acc_id = ($tr_dest_id == $src_id) ? $src_id : $dest_id;

				if ($tr_type == INCOME || $tr_type == TRANSFER || $tr_type == DEBT)
				{
					$balArr[$acc_id] = round($balArr[$acc_id] + $tr_dest_amount, 2);
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
		$keys = array_keys(self::$typeStrArr, $trans_type);
		if (!count($keys))
			return 0;

		return $keys[0];
	}


	// Return string for specified transaction type
	public static function getTypeString($trans_type)
	{
		if (!array_key_exists($trans_type, self::$typeStrArr))
			return NULL;

		return self::$typeStrArr[$trans_type];
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


	// Return source amount of transaction
	public function getSrcAmount($trans_id)
	{
		return $this->getCache($trans_id, "src_amount");
	}


	// Return destination amount of transaction
	public function getDestAmount($trans_id)
	{
		return $this->getCache($trans_id, "dest_amount");
	}


	// Return source currency of transaction
	public function getSrcCurrency($trans_id)
	{
		return $this->getCache($trans_id, "src_curr");
	}


	// Return destination currency of transaction
	public function getDestCurrency($trans_id)
	{
		return $this->getCache($trans_id, "dest_curr");
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


	// Build array with properties of account
	public function getProperties($trans_id)
	{
		$trans_id = intval($trans_id);
		if (!$this->is_exist($trans_id))
			return NULL;

		$row = self::$dcache[$trans_id];
		$res = array("id" => $trans_id,
					"src_id" => $row["src_id"],
					"dest_id" => $row["dest_id"],
					"type" => $row["type"],
					"src_curr" => $row["src_curr"],
					"dest_curr" => $row["dest_curr"],
					"src_amount" => $row["src_amount"],
					"dest_amount" => $row["dest_amount"],
					"date" => $row["date"],
					"comment" => $row["comment"]);

		return $res;
	}
}
