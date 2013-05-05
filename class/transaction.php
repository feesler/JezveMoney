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
			$dest_curr_id = $acc->getCurrency($dest_id);
		}

		$tr_pos = $this->getLatestPos();
		$tr_pos++;

		if (!$db->insertQ("transactions", array("id", "user_id", "src_id", "dest_id", "type", "amount", "charge", "curr_id", "date", "comment", "pos"),
									array(NULL, self::$user_id, $src_id, $dest_id, $trans_type, $amount, $charge, $transcurr, $trans_date, $comment, $tr_pos)))
			return FALSE;

		// update balance of source account
		if ($trans_type == 1 || $trans_type == 3 || $trans_type == 4)
		{
			$srcBalance -= $charge;
			if (!$acc->setBalance($src_id, $srcBalance))
				return FALSE;
		}

		// update balance of destination account
		if ($trans_type == 2 || $trans_type == 3 || $trans_type == 4)
		{
			$destBalance += ($trans_type == 2) ? $charge : $amount;
			if (!$acc->setBalance($dest_id, $destBalance))
				return FALSE;
		}

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
		$trans_curr_id = $transCurr;
		if ($dest_id != 0)
		{
			if (!$acc->is_exist($dest_id))
				return FALSE;

			$destBalance = $acc->getBalance($dest_id);
			$trans_curr_id = $acc->getCurrency($dest_id);		// currency of destination account is currency of transfer transaction
		}

		if (!$trans_curr_id)
			return FALSE;

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
	public function updatePos($trans_id, $new_pos)
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


	// Return link to specified page
	private function getPageLink($trans_type, $acc_id, $page_num, $is_active)
	{
		$resStr = "<span>";

		if ($is_active)
		{
			$resStr .= "<b>";
		}
		else
		{
			$resStr .= "<a href=\"./transactions.php?";
			$resStr .= "type=".$this->getTypeString($trans_type);
			if ($acc_id != 0)
				$resStr .= "&acc_id=".$acc_id;
			$resStr .= "&page=".$page_num;
			$resStr .= "\">";
		}
		$resStr .= $page_num;
		$resStr .= ($is_active) ? "</b>" : "</a>";
		$resStr .= "</span>";

		return $resStr;
	}


	// Return paginator for transaction table
	private function getPaginator($trans_type, $acc_id, $page_num, $pages_count)
	{
		$resStr = "";

		$breakLimit = 5;
		$groupLimit = 3;

		if ($pages_count > $breakLimit)
		{
			if ($page_num < $groupLimit)		// 1 2 3 4 5 ... 18
			{
				for($i = 0; $i < $breakLimit; $i++)
				{
					$resStr .= $this->getPageLink($trans_type, $acc_id, $i + 1, ($i == $page_num))." ";
				}
				$resStr .= " ... ".$this->getPageLink($trans_type, $acc_id, $pages_count, FALSE);
			}
			else if ($page_num >= $groupLimit && $page_num < $pages_count - $groupLimit)		// 1 ... 14 15 16 ... 18
			{
				$resStr = $this->getPageLink($trans_type, $acc_id, 1, FALSE)." ... ";
				for($i = $page_num - ($groupLimit - 2); $i <= $page_num + ($groupLimit - 2); $i++)
				{
					$resStr .= $this->getPageLink($trans_type, $acc_id, $i + 1, ($i == $page_num))." ";
				}
				$resStr .= " ... ".$this->getPageLink($trans_type, $acc_id, $pages_count, FALSE)." ";
			}
			else if ($page_num > $groupLimit && $page_num >= $pages_count - $groupLimit)		// 1 ... 14 15 16 17 18
			{
				$resStr .= $this->getPageLink($trans_type, $acc_id, 1, FALSE)." ... ";
				for($i = $pages_count - ($breakLimit); $i < $pages_count; $i++)
				{
					$resStr .= $this->getPageLink($trans_type, $acc_id, $i + 1, ($i == $page_num))." ";
				}
			}
		}
		else		// 1 2 3 4 5
		{
			for($i = 0; $i < $pages_count; $i++)
			{
				$resStr .= $this->getPageLink($trans_type, $acc_id, $i + 1, ($i == $page_num));
			}
		}

		return $resStr;
	}


	// Return table of transactions
	public function getTable($trans_type, $acc_id = 0, $tr_on_page = 0, $page_num = 0)
	{
		global $db;

		$resStr = "";

		if (!self::$user_id)
			return $resStr;

		$resStr .= "\t<table class=\"infotable\">\r\n";

		$acc = new Account(self::$user_id);
		$accounts = $acc->getCount();
		if (!$accounts)
		{
			$resStr .= "\t\t<tr><td><span>You have no one account. Please create one.</span></td></tr>";
			$resStr .= "\t</table>\r\n";
			return $resStr;
		}

		$condition = "user_id=".self::$user_id;
		if ($trans_type != 4)
			$condition .= " AND type=".$trans_type;
		if ($acc_id != 0)
			$condition .= " AND (src_id=".$acc_id." OR dest_id=".$acc_id.")";

		$orderAndLimit = "date ASC";
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
		{
			$resStr .= "\t\t<tr class=\"extra_row\"><td>You have no one transaction yet.</td></tr>";
			$resStr .= "\t</table>\r\n";
			return $resStr;
		}

		if ($tr_on_page > 0)
		{
			$pageCount = ceil($transCount / $tr_on_page);

			$resStr .= "\t\t<tr class=\"extra_row\">\r\n";
			$resStr .= "\t\t\t<td colspan=\"".(($trans_type == 3 || $trans_type == 4) ? 6 : 5)."\" class=\"pages\">";
			$resStr .= $this->getPaginator($trans_type, $acc_id, $page_num, $pageCount);
			$resStr .= "</td>\r\n";
			$resStr .= "\t\t</tr>\r\n";
		}


		$resStr .= "\t\t<tr>";

		if ($trans_type == 1)
			$resStr .= "<td><b>Source</b></td>";
		else if ($trans_type == 2)
			$resStr .= "<td><b>Destination</b></td>";
		else if ($trans_type == 3 || $trans_type == 4)
			$resStr .= "<td><b>Source</b></td><td><b>Destination</b></td>";

		$resStr .= "<td><b>Amount</b></td><td><b>Date</b></td><td><b>Comment</b></td><td></td></tr>\r\n";

		foreach($resArr as $row)
		{
			$resStr .= "\t\t<tr>";

			$cur_trans_type = intval($row["type"]);

			$resStr .= "<td>";
			if ($cur_trans_type == 1 || $cur_trans_type == 3)
				$resStr .= $acc->getName($row["src_id"]);
			if ($trans_type == 3 || $trans_type == 4)
				$resStr .= "</td><td>";
			if ($cur_trans_type == 2 || $cur_trans_type == 3)
				$resStr .= $acc->getName($row["dest_id"]);
			$resStr .= "</td>";

			$resStr .= "<td class=\"sumcell\">". Currency::format($row["amount"], $row["curr_id"]);
			if ($row["charge"] != $row["amount"])
			{
				$resStr .= " (";
				if ($cur_trans_type == 1 || $cur_trans_type == 3)		// expense or transfer
					$resStr .= Currency::format($row["charge"], $acc->getCurrency($row["src_id"]));
				else if ($cur_trans_type == 2)					// income
					$resStr .= Currency::format($row["charge"], $acc->getCurrency($row["dest_id"]));
				$resStr .= ")";
			}
			$resStr .= "</td>";

			$fdate = date("d.m.Y", strtotime($row["date"]));

			$resStr .= "<td>".$fdate."</td>";
			$resStr .= "<td>".$row["comment"]."</td>";
			$resStr .= "<td><a href=\"./edittransaction.php?id=".$row["id"]."\">edit</a> <a href=\"./deltransaction.php?id=".$row["id"]."\">delete</a></td>";
			$resStr .= "</tr>\r\n";
		}

		if ($tr_on_page > 0)
		{
			$resStr .= "\t\t<tr class=\"extra_row\">";
			$resStr .= "\t\t\t<td colspan=\"".(($trans_type == 3 || $trans_type == 4) ? 6 : 5)."\" class=\"pages\">";
			$resStr .= $this->getPaginator($trans_type, $acc_id, $page_num, $pageCount);
			$resStr .= "\t\t\t</td>";
			$resStr .= "\t\t</tr>";
		}

		$resStr .= "\t</table>\r\n";

		return $resStr;
	}


	// Return table of latest transactions
	public function getLatest($tr_count)
	{
		global $db;

		$resStr = "";

		if (!self::$user_id)
			return $resStr;

		$acc = new Account(self::$user_id);
		$accounts = $acc->getCount();
		if (!$accounts)
			return $resStr;

		$resStr .= "\t<table class=\"infotable\">\r\n";

		$tr_limit = intval($tr_count);
		if (!is_numeric($tr_count) || !$tr_limit)
			return $resStr;

		$condition = "user_id=".self::$user_id;
		$orderAndLimit = "pos DESC LIMIT 0,".$tr_limit;

		$resArr = $db->selectQ("*", "transactions", $condition, NULL, $orderAndLimit);
		$rowCount = count($resArr);
		if (!$rowCount)
		{
			$resStr .= "\t\t<tr class=\"extra_row\"><td>You have no one transaction yet.</td></tr>";
			$resStr .= "\t</table>\r\n";
			return $resStr;
		}

		$resStr .= "\t\t<tr>";

		$resStr .= "<td><b>Description</b></td>";
		$resStr .= "<td><b>Amount</b></td><td><b>Date</b></td><td><b>Comment</b></td></tr>\r\n";

		foreach($resArr as $row)
		{
			$resStr .= "\t\t<tr>";

			$cur_trans_type = intval($row["type"]);

			$resStr .= "<td>";
			if ($cur_trans_type == 1)			// expense
			{
				$resStr .= "Expense from ".$acc->getName($row["src_id"]);
			}
			else if ($cur_trans_type == 2)		// income
			{
				$resStr .= "Income to ".$acc->getName($row["dest_id"]);
			}
			else if ($cur_trans_type == 3)		// transfer
			{
				$resStr .= "Transfer from ".$acc->getName($row["src_id"])." to ".$acc->getName($row["dest_id"]);
			}
			$resStr .= "</td>\r\n";

			$resStr .= "<td class=\"sumcell\">". Currency::format($row["amount"], $row["curr_id"]);
			if ($row["charge"] != $row["amount"])
			{
				$resStr .= " (";
				if ($cur_trans_type == 1 || $cur_trans_type == 3)		// expense or transfer
					$resStr .= Currency::format($row["charge"], $acc->getCurrency($row["src_id"]));
				else if ($cur_trans_type == 2)					// income
					$resStr .= Currency::format($row["charge"], $acc->getCurrency($row["dest_id"]));
				$resStr .= ")";
			}
			$resStr .= "</td>";

			$fdate = date("d.m.Y", strtotime($row["date"]));

			$resStr .= "<td>".$fdate."</td>";
			$resStr .= "<td>".$row["comment"]."</td>";
			$resStr .= "</tr>\r\n";
		}

		$resStr .= "\t</table>\r\n";

		return $resStr;
	}


	// Return string for specified transaction type
	public static function getStringType($trans_type)
	{
		if ($trans_type == "expense")
			return 1;
		else if ($trans_type == "income")
			return 2;
		else if ($trans_type == "transfer")
			return 3;
		else if ($trans_type == "all")
			return 4;
		else if ($trans_type == "debt")
			return 5;
		else
			return 0;
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
		else if ($trans_type == 4)
			return "all";
		else if ($trans_type == 5)
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