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
		$u = new User();
		self::$owner_id = $u->getOwner(self::$user_id);

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
			self::$cache[$acc_id]["icon"] = intval($row["icon"]);
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
	public function create($owner_id, $accname, $balance, $curr_id, $icon_type)
	{
		global $db;

		if (!is_numeric($owner_id) || !$accname || !is_numeric($balance) || !is_numeric($curr_id) || !is_numeric($icon_type))
			return 0;

		$owner_id = intval($owner_id);
		$accname = $db->escape($accname);
		$balance = floatval($balance);
		$curr_id = intval($curr_id);
		$icon_type = intval($icon_type);

		if (!$accname || $accname == "" || !$curr_id)
			return 0;

		if (!$db->insertQ("accounts", array("id", "user_id", "owner_id", "curr_id", "balance", "initbalance", "name", "icon"),
								array(NULL, self::$user_id, $owner_id, $curr_id, $balance, $balance, $accname, $icon_type)))
			return 0;

		$acc_id = $db->insertId();

		self::updateCache();

		return $acc_id;
	}


	// Update account information
	public function edit($acc_id, $accname, $balance, $curr_id, $icon_type)
	{
		global $db;

		if (!$acc_id || !is_numeric($acc_id) || !$accname || !is_numeric($balance) || !is_numeric($curr_id) || !is_numeric($icon_type))
			return FALSE;

		$acc_id = intval($acc_id);
		$accname = $db->escape($accname);
		$balance = floatval($balance);
		$curr_id = intval($curr_id);
		$icon_type = intval($icon_type);

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

		$fields = array("name", "curr_id", "icon");
		$values = array($accname, $curr_id, $icon_type);

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


	// Remove accounts of specified person
	public function onPersonDelete($p_id)
	{
		global $db;

		if (!self::$full_list)
			return FALSE;

		if (!$this->checkCache())
			return FALSE;

		foreach(self::$cache as $acc_id => $row)
		{
			if ($row["owner_id"] == $p_id)
			{
				if (!$this->del($acc_id))
					return FALSE;
			}
		}

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


	// Return icon type of account
	public function getIcon($acc_id)
	{
		return $this->getCache($acc_id, "icon");
	}


	// Return name of account
	public function setIcon($acc_id, $icon_type)
	{
		if (!$acc_id || !is_numeric($icon_type))
			return FALSE;

		return $this->setValue($acc_id, "icon", intval($icon_type));
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
		if (self::$owner_id == $acc_onwer || !self::$full_list)
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
			$resArr[] = array($acc_id, $row["curr_id"], Currency::getSign($row["curr_id"]), $row["balance"], $row["name"], $row["icon"]);
		}

		return $resArr;
	}


	// Return HTML for account tile
	public function getTileEx($tile_type, $acc_id, $bal_corr, $tile_id = "")
	{
		if (!$this->is_exist($acc_id))
			return "";

		if ($tile_id == "")
			$tile_id = "acc_".$acc_id;

		$b_corr = floatVal($bal_corr);

		$acc_name = $this->getName($acc_id);
		$acc_curr = $this->getCurrency($acc_id);
		$acc_balance = $this->getBalance($acc_id);
		$acc_icon = $this->getIcon($acc_id);
		$balance_fmt = Currency::format($acc_balance + $b_corr, $acc_curr);

		$tile_act = NULL;
		if ($tile_type == LINK_TILE)
			$tile_act = "./newtransaction.php?acc_id=".$acc_id;
		else if ($tile_type == BUTTON_TILE)
			$tile_act = "onTileClick(".$acc_id.");";

		$addClass = NULL;
		if ($acc_icon != 0)
		{
			if ($acc_icon == 1)
				$addClass = "purse_icon";
			else if ($acc_icon == 2)
				$addClass = "safe_icon";
			else if ($acc_icon == 3)
				$addClass = "card_icon";
			else if ($acc_icon == 4)
				$addClass = "percent_icon";
			else if ($acc_icon == 5)
				$addClass = "bank_icon";
			else if ($acc_icon == 6)
				$addClass = "cash_icon";
		}

		return getTile($tile_type, $tile_id, $acc_name, $balance_fmt, $tile_act, $addClass);
	}


	// Return HTML for account tile
	public function getTile($tile_type, $acc_id, $tile_id = "")
	{
		return $this->getTileEx($tile_type, $acc_id, 0.0, $tile_id);
	}


	// Return HTML for accounts of user
	public function getTiles($buttons = FALSE)
	{
		$resStr = "";

		if (!$this->checkCache())
			return $resStr;

		$accounts = count(self::$cache);
		if (!$accounts)
		{
			$resStr .= "<span>You have no one account. Please create one.</span>";
		}
		else
		{
			foreach(self::$cache as $acc_id => $row)
			{
				if ($buttons)
					$resStr .= $this->getTile(BUTTON_TILE, $acc_id);
				else
					$resStr .= $this->getTile(LINK_TILE, $acc_id);
			}
		}

		return $resStr;
	}


	// Return HTML for total sums per each currency
	public function getTotals()
	{
		if (!$this->checkCache())
			return $resStr;

		html_op("<div>");

		$accounts = count(self::$cache);
		if (!$accounts)
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

				html_op("<div class=\"info_tile\">");
					$valfmt = Currency::format($value, $key);
					$currName = Currency::getName($key);

					html("<span class=\"info_title\">".$currName."</span>");
					html("<span class=\"info_subtitle\">".$valfmt."</span>");
				html_cl("</div>");
			}
		}

		html_cl("</div>");
	}
}

?>