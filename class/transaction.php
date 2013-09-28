﻿<?php

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

		$cond = "user_id=".self::$user_id;
		if ($trans_id != 0)
			$cond .= " AND id=".$trans_id;
		else
			self::$cache = array();

		$resArr = $db->selectQ("*", "transactions", $cond);
		if (!count($resArr))		// delete transaction from cache if can't find it
		{
			unset(self::$cache[$trans_id]);
		}
		else
		{
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
	}


	// Check state of cache and update if needed
	private function checkCache($trans_id = 0)
	{
		if (is_null(self::$cache) || $trans_id != 0)
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
			if ($trans_type == 3 || ($trans_type == 4 && $acc->getOwner($dest_id) != User::getOwner(self::$user_id)))
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
		if ($trans_type == 1 || $trans_type == 3 || $trans_type == 4)
		{
			if ($trans_type == 4 && ($acc->getOwner($src_id) != User::getOwner(self::$user_id)))		// person give to us
				$srcBalance -= $amount;
			else
				$srcBalance -= $charge;
			if (!$acc->setBalance($src_id, $srcBalance))
				return FALSE;
		}

		// update balance of destination account
		if ($trans_type == 2 || $trans_type == 3 || $trans_type == 4)
		{
			if (($trans_type == 2) || ($trans_type == 4 && ($acc->getOwner($src_id) != User::getOwner(self::$user_id))))		// income or person give to us
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
			if ($trans_type == 3 || ($trans_type == 4 && $acc->getOwner($dest_id) != User::getOwner(self::$user_id)))
				$trans_curr_id = $acc->getCurrency($dest_id);		// currency of destination account is currency of transfer transaction
		}

		if (!$trans_curr_id)
			return FALSE;

		// update balance of source account
		if ($transType == 1 || $transType == 3 || $transType == 4)		// spend, transfer or debt
		{
			if ($transType == 4 && ($acc->getOwner($src_id) != User::getOwner(self::$user_id)))		// person give to us
				$srcBalance += $transAmount;
			else
				$srcBalance += $transCharge;

			if (!$acc->setBalance($src_id, $srcBalance))
				return FALSE;
		}

		// update balance of destination account
		if ($transType == 2 || $transType == 3 || $transType == 4)		// income, transfer or debt
		{
			if (($transType == 2) || ($transType == 4 && ($acc->getOwner($src_id) != User::getOwner(self::$user_id))))		// income or person give to us
				$destBalance -= $transCharge;
			else
				$destBalance -= $transAmount;

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

		$acc = new Account(self::$user_id, TRUE);

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
			if ($trans_type == 3 || ($trans_type == 4 && $acc->getOwner($dest_id) != User::getOwner(self::$user_id)))
				$trans_curr_id = $acc->getCurrency($dest_id);		// currency of destination account is currency of transfer transaction
		}

		if (!$trans_curr_id)
			return FALSE;

		// check date is changed
		$orig_date = getdate($this->getDate($trans_id));
		$target_date = getdate(strtotime($trans_date));

		if (mktime(0, 0, 0, $orig_date["mon"], $orig_date["mday"], $orig_date["year"]) != mktime(0, 0, 0, $target_date["mon"], $target_date["mday"], $target_date["year"]))
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
		if ($trans_type == 1 || $trans_type == 3 || $trans_type == 4)				// spend, transfer or debt
		{
			if ($trans_type == 4 && ($acc->getOwner($src_id) != User::getOwner(self::$user_id)))		// person give to us
				$srcBalance -= $amount;
			else
				$srcBalance -= $charge;

			if (!$acc->setBalance($src_id, $srcBalance))
				return FALSE;
		}

		// update balance of destination account
		if ($trans_type == 2 || $trans_type == 3 || $trans_type == 4)		// income, transfer or debt
		{
			if (($trans_type == 2) || ($trans_type == 4 && ($acc->getOwner($src_id) != User::getOwner(self::$user_id))))		// income or person give to us
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

		return TRUE;
	}


	// Check is transaction with specified position exist
	public function isPosExist($trans_pos)
	{
		global $db;

		$tr_pos = intval($trans_pos);

		$resArr = $db->selectQ("pos", "transactions", "user_id=".self::$user_id." AND pos=".$tr_pos);
		return (count($resArr) == 1);
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

		self::updateCache($trans_id);

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

		// delete debts
		if (!$db->deleteQ("transactions", $condition." AND (src_id=".$acc_id." OR dest_id=".$acc_id.") AND type=4"))
			return FALSE;

		// set transfer from as income to destination account
		if (!$db->updateQ("transactions", array("src_id", "type"), array(0, 2), $condition." AND src_id=".$acc_id." AND type=3"))
			return FALSE;

		// set transfer to as expense from source account
		if (!$db->updateQ("transactions", array("dest_id", "type"), array(0, 1), $condition." AND dest_id=".$acc_id." AND type=3"))
			return FALSE;

		return TRUE;
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
					$resStr .= $this->getPageLink($trans_type, $acc_id, $i + 1, ($i == $page_num));
				}
				$resStr .= "<span>...</span>".$this->getPageLink($trans_type, $acc_id, $pages_count, FALSE);
			}
			else if ($page_num >= $groupLimit && $page_num < $pages_count - $groupLimit)		// 1 ... 14 15 16 ... 18
			{
				$resStr = $this->getPageLink($trans_type, $acc_id, 1, FALSE)."<span>...</span>";
				for($i = $page_num - ($groupLimit - 2); $i <= $page_num + ($groupLimit - 2); $i++)
				{
					$resStr .= $this->getPageLink($trans_type, $acc_id, $i + 1, ($i == $page_num));
				}
				$resStr .= "<span>...</span>".$this->getPageLink($trans_type, $acc_id, $pages_count, FALSE);
			}
			else if ($page_num > $groupLimit && $page_num >= $pages_count - $groupLimit)		// 1 ... 14 15 16 17 18
			{
				$resStr .= $this->getPageLink($trans_type, $acc_id, 1, FALSE)."<span>...</span>";
				for($i = $pages_count - ($breakLimit); $i < $pages_count; $i++)
				{
					$resStr .= $this->getPageLink($trans_type, $acc_id, $i + 1, ($i == $page_num));
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
	public function getTable($trans_type, $acc_id = 0, $isDesc = FALSE, $tr_on_page = 0, $page_num = 0, $showPaginator = TRUE, $active = TRUE)
	{
		global $db;

		if (!self::$user_id)
			return $resStr;

		$owner_id = User::getOwner(self::$user_id);
		if (!$owner_id)
			return $resStr;

		$pers = new Person(self::$user_id);

		html_op("<div class=\"trans_list\">");

		$acc = new Account(self::$user_id, TRUE);
		$accounts = $acc->getCount();
		if (!$accounts)
		{
			html("<span>You have no one account. Please create one.</span>");
			html_cl("</div>");
			return;
		}

		$condition = "user_id=".self::$user_id;
		if ($trans_type != 0)
			$condition .= " AND type=".$trans_type;
		if ($acc_id != 0)
			$condition .= " AND (src_id=".$acc_id." OR dest_id=".$acc_id.")";

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
		{
			html("<span>You have no one transaction yet.</span>");
			html_cl("</div>");

			return;
		}

		if ($tr_on_page > 0 && $showPaginator == TRUE)
		{
			$pageCount = ceil($transCount / $tr_on_page);

			html_op("<div class=\"paginator\">");

			if ($transCount > $tr_on_page)
				html($this->getPaginator($trans_type, $acc_id, $page_num, $pageCount));

			html_cl("</div>");
		}

		$row_num = 1;
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

			if ($cur_trans_type == 4)
			{
				$src_owner_id = $acc->getOwner($src_id);
				$dest_owner_id = $acc->getOwner($dest_id);
			}

			$resStr = "<div id=\"tr_".$trans_id."\" class=\"latest".((($row_num % 2) == 0) ? " even_row" : "")."\"";
			if ($active == TRUE)
				$resStr .= " onclick=\"onTransClick(".$trans_id.");\"";
			$resStr .= ">";
			html_op($resStr);

			html_op("<div>");

			$resStr = "<div><span class=\"latest_acc_name\">";
			if ($cur_trans_type == 1 || $cur_trans_type == 3)		// expense or transfer
				$resStr .= $acc->getName($src_id);
			else if ($cur_trans_type == 4)
				$resStr .= $acc->getNameOrPerson($src_id);

			if ($cur_trans_type == 3 || $cur_trans_type == 4)
				$resStr .= " → ";

			if ($cur_trans_type == 2 || $cur_trans_type == 3)		// income or transfer
				$resStr .= $acc->getName($dest_id);
			else if ($cur_trans_type == 4)
				$resStr .= $acc->getNameOrPerson($dest_id);

			$resStr .= "</span></div>";
			html($resStr);

			$resStr = "<div><span class=\"latest_sum\">";
			if ($cur_trans_type == 1 || ($cur_trans_type == 4 && $src_owner_id == $owner_id))			// expense
				$resStr .= "- ";
			else if ($cur_trans_type == 2 || ($cur_trans_type == 4 && $dest_owner_id == $owner_id))			// income
				$resStr .= "+ ";

			$resStr .= Currency::format($amount, $curr_id);
			if ($charge != $amount)
			{
				if ($cur_trans_type == 2 || ($cur_trans_type == 4 && $dest_owner_id == $owner_id))
					$acc_curr = $acc->getCurrency($dest_id);
				else
					$acc_curr = $acc->getCurrency($src_id);
				$resStr .= " (".Currency::format($charge, $acc_curr).")";
			}
			$resStr .= "</span></div>";
			html($resStr);

			html_op("<div>");
			html("<span class=\"latest_date\">".$fdate."</span>");
			if ($comment != "")
				html("<span class=\"latest_comm\"> | ".$comment."</span>");

			html_cl("</div>");
			html_cl("</div>");
			html_cl("</div>");

			$row_num++;
		}

		if ($tr_on_page > 0 && $showPaginator == TRUE)
		{
			html_op("<div class=\"paginator\">");
			if ($transCount > $tr_on_page)
				html($this->getPaginator($trans_type, $acc_id, $page_num, $pageCount));
			html_cl("</div>");
		}

		html_cl("</div>");
		html();
	}


	// Return table of latest transactions
	public function getLatest($tr_count)
	{
		return $this->getTable(0, 0, TRUE, $tr_count, 0, FALSE);
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