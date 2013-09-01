<?php

class Account
{
	static private $cache = NULL;
	static private $user_id = 0;
	static private $owner_id = 0;
	static private $full_list = FALSE;


	// Class constructor
	function __construct($user_id, $full = FALSE)
	{
		if ($user_id != self::$user_id || $full != self::$full_list)
			self::$cache = NULL;

		self::$full_list = $full;
		self::$user_id = intval($user_id);
	}


	// Update cache
	private function updateCache()
	{
		global $db;

		self::$cache = array();

		// find owner person
		self::$owner_id = User::getOwner(self::$user_id);

		$condition = "user_id=".self::$user_id;
		if (!self::$full_list && self::$owner_id != 0)
			$condition .= " AND owner_id=".self::$owner_id;

		$resArr = $db->selectQ("*", "accounts", $condition);
		foreach($resArr as $row)
		{
			$acc_id = $row["id"];

			self::$cache[$acc_id]["user_id"] = $row["user_id"];
			self::$cache[$acc_id]["name"] = $row["name"];
			self::$cache[$acc_id]["owner_id"] = intval($row["owner_id"]);
			self::$cache[$acc_id]["curr_id"] = intval($row["curr_id"]);
			self::$cache[$acc_id]["balance"] = floatval($row["balance"]);
			self::$cache[$acc_id]["initbalance"] = floatval($row["initbalance"]);
		}
	}


	// Check state of cache and update if needed
	private function checkCache()
	{
		if (is_null(self::$cache))
			$this->updateCache();

		return (!is_null(self::$cache));
	}


	// Return value of specified account from cache
	private function getCache($acc_id, $val)
	{
		$acc_id = intval($acc_id);
		if (!$acc_id || !$val)
			return NULL;

		if (!$this->checkCache())
			return NULL;

		if (!isset(self::$cache[$acc_id]))
			return NULL;

		return self::$cache[$acc_id][$val];
	}


	// Return count of user accounts
	public function getCount()
	{
		if (!$this->checkCache())
			return 0;

		return count(self::$cache);
	}


	// Check is specified account is exist
	public function is_exist($acc_id)
	{
		if (!is_numeric($acc_id))
			return FALSE;

		$acc_id = intval($acc_id);
		if (!$acc_id)
			return FALSE;

		if (!$this->checkCache())
			return FALSE;

		return isset(self::$cache[$acc_id]);
	}


	// Create new account for current user
	public function create($owner_id, $accname, $balance, $curr_id)
	{
		global $db;

		if (!is_numeric($owner_id) || !$accname || !is_numeric($balance) || !is_numeric($curr_id))
			return FALSE;

		$owner_id = intval($owner_id);
		$accname = $db->escape($accname);
		$balance = floatval($balance);
		$curr_id = intval($curr_id);

		if (!$accname || $accname == "" || !$curr_id)
			return FALSE;

		if (!$db->insertQ("accounts", array("id", "user_id", "owner_id", "curr_id", "balance", "initbalance", "name"),
								array(NULL, self::$user_id, $owner_id, $curr_id, $balance, $balance, $accname)))
			return FALSE;

		self::updateCache();

		return TRUE;
	}


	// Update account information
	public function edit($acc_id, $accname, $balance, $curr_id)
	{
		global $db;

		if (!$acc_id || !is_numeric($acc_id) || !$accname || !is_numeric($balance) || !is_numeric($curr_id))
			return FALSE;

		$acc_id = intval($acc_id);
		$accname = $db->escape($accname);
		$balance = floatval($balance);
		$curr_id = intval($curr_id);

		// check account is exist
		if (!$this->is_exist($acc_id))
			return FALSE;

		// check user of account
		if ($this->getUser($acc_id) != self::$user_id)
			return FALSE;

		// check is currency exist
		if (!Currency::is_exist($curr_id))
			return FALSE;

		// get initial balance to calc difference
		$diff = 0.0;
		$initbalance = $this->getInitBalance($acc_id);
		$diff = $balance - $initbalance;

		$fields = array("name", "curr_id");
		$values = array($accname, $curr_id);

		if (abs($diff) > 0.01)
		{
			$newbalance = $this->getBalance($acc_id) + $diff;

			$fields[] = "balance";
			$values[] = $newbalance;
			$fields[] = "initbalance";
			$values[] = $balance;
		}

		if (!$db->updateQ("accounts", $fields, $values, "id=".$acc_id))
			return FALSE;

		self::updateCache();

		return TRUE;
	}


	// Delete account
	public function del($acc_id)
	{
		global $db;

		if (!$acc_id || !is_numeric($acc_id))
			return FALSE;

		$acc_id = intval($acc_id);

		// check account is exist
		if (!$this->is_exist($acc_id))
			return FALSE;

		// check user of account
		if ($this->getUser($acc_id) != self::$user_id)
			return FALSE;

		$trans = new Transaction(self::$user_id);
		if (!$trans->onAccountDelete($acc_id))
		{
			wlog("trans->onAccountDelete(".$acc_id.") return FALSE");
			return FALSE;
		}

		// delete account
		if (!$db->deleteQ("accounts", "user_id=".self::$user_id." AND id=".$acc_id))
			return FALSE;

		self::updateCache();

		return TRUE;
	}


	// Set new value of account
	private function setValue($acc_id, $field, $newValue)
	{
		global $db;

		if (!$acc_id || is_null($field) || $field == "")
			return FALSE;

		if (!$db->updateQ("accounts", array($field), array($newValue), "id=".$acc_id))
			return FALSE;

		self::updateCache();

		return TRUE;
	}


	// Delete all accounts of user
	public function reset()
	{
		global $db;

		// delete all transactions of user
		if (!$db->deleteQ("transactions", "user_id=".self::$user_id))
			return FALSE;

		// delete all accounts of user
		if (!$db->deleteQ("accounts", "user_id=".self::$user_id))
			return FALSE;

		self::updateCache();

		return TRUE;
	}


	// Return owner of account
	public function getOwner($acc_id)
	{
		return $this->getCache($acc_id, "owner_id");
	}


	// Return user of account
	public function getUser($acc_id)
	{
		return $this->getCache($acc_id, "user_id");
	}


	// Return currency of account
	public function getCurrency($acc_id)
	{
		return $this->getCache($acc_id, "curr_id");
	}


	// Set currency of account
	public function setCurrency($acc_id, $curr_id)
	{
		if (!$acc_id || is_numeric($curr_id))
			return FALSE;

		return $this->setValue($acc_id, "curr_id", intval($curr_id));
	}


	// Return name of account
	public function getName($acc_id)
	{
		return $this->getCache($acc_id, "name");
	}


	// Set initial balance of account
	public function setName($acc_id, $name)
	{
		if (!$acc_id || is_null($name) || $name == "")
			return FALSE;

		return $this->setValue($acc_id, "name", $name);
	}


	// Return current balance of account
	public function getBalance($acc_id)
	{
		return $this->getCache($acc_id, "balance");
	}


	// Set owner of account
	public function setOwner($acc_id, $owner_id)
	{
		if (!$acc_id || !$owner_id || !is_numeric($owner_id))
			return FALSE;

		return $this->setValue($acc_id, "owner_id", intval($owner_id));
	}


	// Set balance of account
	public function setBalance($acc_id, $balance)
	{
		if (!$acc_id || !is_numeric($balance))
			return FALSE;

		return $this->setValue($acc_id, "balance", floatval($balance));
	}


	// Return name of account
	public function getInitBalance($acc_id)
	{
		return $this->getCache($acc_id, "initbalance");
	}


	// Set initial balance of account
	public function setInitBalance($acc_id, $initbalance)
	{
		if (!$acc_id || !is_numeric($initbalance))
			return FALSE;

		return $this->setValue($acc_id, "initbalance", floatval($initbalance));
	}


	// Return id of account by specified position
	public function getIdByPos($position)
	{
		if (!$this->checkCache())
			return 0;

		$keys = array_keys(self::$cache);
		if (isset($keys[$position]))
			return $keys[$position];

		return 0;
	}


	// Return name of account if owner is user or name of person else
	public function getNameOrPerson($acc_id)
	{
		if (!is_numeric($acc_id))
			return "";

		$acc_id = intval($acc_id);
		if (!$acc_id)
			return "";

		$acc_onwer = $this->getOwner($acc_id);
		if (self::$owner_id == $acc_onwer)
		{
			return $this->getName($acc_id);
		}
		else
		{
			$pers = new Person(self::$user_id);
			return $pers->getName($acc_onwer);
		}
	}


	// Return HTML string of accounts for select control
	public function getList($selected_id = 0)
	{
		global $tabStr;

		$resStr = "";

		if (!$this->checkCache())
			return $resStr;

		foreach(self::$cache as $acc_id => $row)
		{
			$resStr .= $tabStr."<option value=\"".$acc_id."\"";
			if ($acc_id == $selected_id)
				$resStr .= " selected";
			$resStr .= ">".$row["name"]."</option>\r\n";
		}

		return $resStr;
	}


	// Return Javascript array of accounts
	public function getArray()
	{
		if (!$this->checkCache())
			return "";

		$resArr = array();

		foreach(self::$cache as $acc_id => $row)
		{
			$resArr[] = array($acc_id, $row["curr_id"], Currency::getSign($row["curr_id"]), $row["balance"], $row["name"]);
		}

		return "var accounts = ".json_encode($resArr).";\r\n";
	}


	// Return table of user accounts
	public function getTable($transfer = FALSE, $editlink = FALSE)
	{
		$resStr = "";

		if (!$this->checkCache())
			return $resStr;

		$resStr .= "\t<table class=\"infotable\">\r\n";

		$accounts = count(self::$cache);
		if ((!$accounts && !$transfer) || ($accounts < 2 && $transfer))
		{
			$resStr .= "\t\t<tr class=\"extra_row\"><td><span>";
			if ($transfer)
				$resStr .= "You need at least two accounts to transfer.";
			else
				$resStr .= "You have no one account. Please create one.";
			$resStr .= "</span></td></tr>\r\n";
		}
		else
		{
			$resStr .= "\t\t<tr class=\"even_row\"><td><b>Name</b></td><td><b>Currency</b></td><td><b>Balance</b></td>";
			if ($editlink == TRUE)
				$resStr .= "<td></td>";
			$resStr .= "</tr>\r\n";

			$totalArr = array();

			$row_num = 1;
			foreach(self::$cache as $acc_id => $row)
			{
				$balfmt = Currency::format($row["balance"], $row["curr_id"]);
				$currname = Currency::getName($row["curr_id"]);

				if ($currname != "" && !$totalArr[$row["curr_id"]])
					$totalArr[$row["curr_id"]] = 0;

				$totalArr[$row["curr_id"]] += $row["balance"];

				$resStr .= "\t\t<tr";
				if (($row_num % 2) == 0)
					$resStr .= " class=\"even_row\"";
				$resStr .= "><td>".$row["name"]."</td><td>".$currname."</td><td style=\"text-align: right;\">".$balfmt."</td>";
				if ($editlink == TRUE)
					$resStr .= "<td><a href=\"./editaccount.php?id=".$acc_id."\">edit</a> <a href=\"./checkbalance.php?id=".$acc_id."\">check</a> <a href=\"./csvexport.php?id=".$acc_id."\">export to csv</a> <a href=\"./delaccount.php?id=".$acc_id."\">delete</a></td>";
				$resStr .= "</tr>\r\n";

				$row_num++;
			}

			$resStr .= "\t\t<tr class=\"extra_row\">";
			$resStr .= "<td colspan=\"".(($editlink == TRUE) ? "4" : "3")."\" style=\"height: 10px;\"></td></tr>\r\n";

			foreach($totalArr as $key => $value)
			{
				$valfmt = Currency::format($value, $key);
				$currname = Currency::getName($key);

				$resStr .= "\t\t<tr";
				if (($row_num % 2) == 0)
					$resStr .= " class=\"even_row\"";
				$resStr .= "><td>Total</td><td>".$currname."</td><td class=\"sumcell\">".$valfmt."</td>";
				if ($editlink == TRUE)
					$resStr .= "<td></td>";
				$resStr .= "</tr>\r\n";

				$row_num++;
			}
		}

		$resStr .= "\t</table>\r\n";

		return $resStr;
	}


	// Return HTML for account tile
	public function getTile($tile_type, $acc_id, $tile_id = "")
	{
		if (!$this->is_exist($acc_id))
			return "";

		if ($tile_id == "")
			$tile_id = "acc_".$acc_id;

		$acc_name = $this->getName($acc_id);
		$acc_curr = $this->getCurrency($acc_id);
		$acc_balance = $this->getBalance($acc_id);
		$balance_fmt = Currency::format($acc_balance, $acc_curr);

		$tile_act = NULL;
		if ($tile_type == LINK_TILE)
			$tile_act = "./newtransaction.php?acc_id=".$acc_id;
		else if ($tile_type == BUTTON_TILE)
			$tile_act = "onTileClick(".$acc_id.");";

		return getTile($tile_type, $tile_id, $acc_name, $balance_fmt, $tile_act);
	}


	// Return HTML for accounts of user
	public function getTiles($buttons = FALSE)
	{
		$resStr = "";

		if (!$this->checkCache())
			return $resStr;

		foreach(self::$cache as $acc_id => $row)
		{
			if ($buttons)
				$resStr .= $this->getTile(BUTTON_TILE, $acc_id);
			else
				$resStr .= $this->getTile(LINK_TILE, $acc_id);
		}

		return $resStr;
	}


	// Return HTMl for total sums per each currency
	public function getTotals()
	{
		global $tabStr;

		$resStr = "";

		if (!$this->checkCache())
			return $resStr;

		html_op("<div class=\"trans_list\">");

		$accounts = count(self::$cache);
		if ((!$accounts && !$transfer) || ($accounts < 2 && $transfer))
		{
			html("<span>You have no one account. Please create one.</span>");
		}
		else
		{
			$totalArr = array();
			foreach(self::$cache as $acc_id => $row)
			{
				$currname = Currency::getName($row["curr_id"]);

				if ($currname != "" && !$totalArr[$row["curr_id"]])
					$totalArr[$row["curr_id"]] = 0;

				$totalArr[$row["curr_id"]] += $row["balance"];
			}

			$i = 0;
			foreach($totalArr as $key => $value)
			{
				$i++;

				$resStr = "<div class=\"latest";
				if ($i % 2 == 0)
					$resStr .= " even_row";
				$resStr .= "\">";
				html_op($resStr);

				$valfmt = Currency::format($value, $key);
				$currName = Currency::getName($key);

				html("<div><span class=\"latest_acc_name\">".$currName."</span></div>");
				html("<div><span class=\"latest_sum\">".$valfmt."</span></div>");

				html_cl("</div>");
			}
		}

		html_cl("</div>");
	}
}

?>