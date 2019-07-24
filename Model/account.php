<?php

class AccountModel extends CachedTable
{
	static private $dcache = NULL;
	static private $user_id = 0;
	static private $owner_id = 0;
	static private $full_list = FALSE;
	static private $icons = ["No icon", "Purse", "Safe", "Card", "Percent", "Bank", "Cash"];
	static private $iconClass = ["", "purse_icon", "safe_icon", "card_icon", "percent_icon", "bank_icon", "cash_icon"];


	// Class constructor
	public function __construct($user_id, $full = FALSE)
	{
		if ($user_id != self::$user_id || $full != self::$full_list)
			self::$dcache = NULL;

		self::$full_list = $full;
		self::$user_id = intval($user_id);

		$this->dbObj = mysqlDB::getInstance();
		$this->currMod = new CurrencyModel();
	}


	// Return link to cache of derived class
	protected function &getDerivedCache()
	{
		return self::$dcache;
	}


	// Update cache
	protected function updateCache()
	{
		self::$dcache = [];

		// find owner person
		$uMod = new UserModel();
		self::$owner_id = $uMod->getOwner(self::$user_id);

		$condArr = ["user_id=".self::$user_id];
		if (!self::$full_list && self::$owner_id != 0)
			$condArr[] = "owner_id=".self::$owner_id;

		$resArr = $this->dbObj->selectQ("*", "accounts", $condArr, "id");
		foreach($resArr as $row)
		{
			$acc_id = $row["id"];

			self::$dcache[$acc_id]["user_id"] = $row["user_id"];
			self::$dcache[$acc_id]["name"] = $row["name"];
			self::$dcache[$acc_id]["owner_id"] = intval($row["owner_id"]);
			self::$dcache[$acc_id]["curr_id"] = intval($row["curr_id"]);
			self::$dcache[$acc_id]["balance"] = floatval($row["balance"]);
			self::$dcache[$acc_id]["initbalance"] = floatval($row["initbalance"]);
			self::$dcache[$acc_id]["icon"] = intval($row["icon"]);
			self::$dcache[$acc_id]["createdate"] = strtotime($row["createdate"]);
			self::$dcache[$acc_id]["updatedate"] = strtotime($row["updatedate"]);
		}
	}


	// Create new account for current user
	public function create($owner_id, $accname, $balance, $curr_id, $icon_type)
	{
		if (!is_numeric($owner_id) || !$accname || !is_numeric($balance) || !is_numeric($curr_id) || !is_numeric($icon_type))
			return 0;

		$owner_id = intval($owner_id);
		$accname = $this->dbObj->escape($accname);
		$balance = floatval($balance);
		$curr_id = intval($curr_id);
		$icon_type = intval($icon_type);

		if (!$accname || $accname == "" || !$curr_id)
			return 0;

		$curDate = date("Y-m-d H:i:s");

		if (!$this->dbObj->insertQ("accounts", ["id", "user_id", "owner_id", "curr_id", "balance", "initbalance", "name", "icon", "createdate", "updatedate"],
								[NULL, self::$user_id, $owner_id, $curr_id, $balance, $balance, $accname, $icon_type, $curDate, $curDate]))
			return 0;

		$acc_id = $this->dbObj->insertId();

		$this->cleanCache();

		return $acc_id;
	}


	// Update account information
	public function edit($acc_id, $accname, $balance, $curr_id, $icon_type)
	{
		if (!$acc_id || !is_numeric($acc_id) || !$accname || !is_numeric($balance) || !is_numeric($curr_id) || !is_numeric($icon_type))
			return FALSE;

		$acc_id = intval($acc_id);
		$accname = $this->dbObj->escape($accname);
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
		if (!$this->currMod->is_exist($curr_id))
			return FALSE;

		// get initial balance to calc difference
		$diff = 0.0;
		$initbalance = $this->getInitBalance($acc_id);
		$diff = $balance - $initbalance;

		$curDate = date("Y-m-d H:i:s");

		$fields = ["name", "curr_id", "icon", "updatedate"];
		$values = [$accname, $curr_id, $icon_type, $curDate];

		if (abs($diff) > 0.01)
		{
			$newbalance = $this->getBalance($acc_id) + $diff;

			$fields[] = "balance";
			$values[] = $newbalance;
			$fields[] = "initbalance";
			$values[] = $balance;
		}

		if (!$this->dbObj->updateQ("accounts", $fields, $values, "id=".$acc_id))
			return FALSE;

		$this->cleanCache();

		return TRUE;
	}


	// Delete account
	public function del($acc_id)
	{
		if (!$acc_id || !is_numeric($acc_id))
			return FALSE;

		$acc_id = intval($acc_id);

		// check account is exist
		if (!$this->is_exist($acc_id))
			return FALSE;

		// check user of account
		if ($this->getUser($acc_id) != self::$user_id)
			return FALSE;

		$transMod = new TransactionModel(self::$user_id);
		if (!$transMod->onAccountDelete($acc_id))
		{
			wlog("trans->onAccountDelete(".$acc_id.") return FALSE");
			return FALSE;
		}

		// delete account
		$condArr = ["user_id=".self::$user_id, "id=".$acc_id];
		if (!$this->dbObj->deleteQ("accounts", $condArr))
			return FALSE;

		$this->cleanCache();

		return TRUE;
	}


	// Remove accounts of specified person
	public function onPersonDelete($p_id)
	{
		if (!self::$full_list)
			return FALSE;

		if (!$this->checkCache())
			return FALSE;

		foreach(self::$dcache as $acc_id => $row)
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
		if (!$acc_id || is_null($field) || $field == "")
			return FALSE;

		if (!$this->dbObj->updateQ("accounts", [$field, "updatedate"], [$newValue, date("Y-m-d H:i:s")], "id=".$acc_id))
			return FALSE;

		$this->cleanCache();

		return TRUE;
	}


	// Delete all accounts of user
	public function reset()
	{
		// delete all transactions of user
		if (!$this->dbObj->deleteQ("transactions", "user_id=".self::$user_id))
			return FALSE;

		// delete all accounts of user
		if (!$this->dbObj->deleteQ("accounts", "user_id=".self::$user_id))
			return FALSE;

		$this->cleanCache();

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

		$keys = array_keys(self::$dcache);
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
			$persMod = new PersonModel(self::$user_id);
			return $persMod->getName($acc_onwer);
		}
	}


	// Return array of icons
	public function getIconsArray()
	{
		return self::$icons;
	}


	// Return Javascript array of accounts
	public function getArray()
	{
		$resArr = [];

		if (!$this->checkCache())
			return $resArr;

		foreach(self::$dcache as $acc_id => $row)
		{
			$accObj = new stdClass;

			$accObj->id = $acc_id;
			$accObj->curr_id = $row["curr_id"];
			$accObj->balance = $row["balance"];
			$accObj->name = $row["name"];
			$accObj->icon = $row["icon"];
			$accObj->initbalance = $row["initbalance"];

			$resArr[] = $accObj;
		}

		return $resArr;
	}


	// Return array of accounts for template
	public function getTilesArray()
	{
		$res = [];

		if (!$this->checkCache())
			return $res;

		$accounts = count(self::$dcache);

		foreach(self::$dcache as $acc_id => $row)
		{
			$acc_balance = $this->getBalance($acc_id);
			$icon_id = $row["icon"];
			$acc_icon = $this->getIconClass($icon_id);
			$balance_fmt = $this->currMod->format($row["balance"], $row["curr_id"]);

			$res[$acc_id] = ["name" => $row["name"],
								"balance" => $balance_fmt,
								"icon" => $acc_icon];
		}

		return $res;
	}


	// Return class for specified icon
	public function getIconClass($icon_id)
	{
		$icon_id = intval($icon_id);

		return ($icon_id != 0 && isset(self::$iconClass[$icon_id])) ? " tile_icon ".self::$iconClass[$icon_id] : "";
	}


	// Return array of total sums per each currency
	public function getTotalsArray()
	{
		$res = [];

		if (!$this->checkCache())
			return $res;

		foreach(self::$dcache as $acc_id => $row)
		{
			$currname = $this->currMod->getName($row["curr_id"]);

			if ($currname != "" && !isset($res[$row["curr_id"]]))
				$res[$row["curr_id"]] = 0;

			$res[$row["curr_id"]] += $row["balance"];
		}

		return $res;
	}


	// Build array with properties of account
	public function getProperties($acc_id)
	{
		$acc_id = intval($acc_id);
		if (!$this->is_exist($acc_id))
			return NULL;

		$res = ["id" => $acc_id,
					"owner" => self::$dcache[$acc_id]["owner_id"],
					"name" => self::$dcache[$acc_id]["name"],
					"balance" => self::$dcache[$acc_id]["balance"],
					"initbalance" => self::$dcache[$acc_id]["initbalance"],
					"curr" => self::$dcache[$acc_id]["curr_id"],
					"sign" => $this->currMod->getSign(self::$dcache[$acc_id]["curr_id"]),
					"icon" => self::$dcache[$acc_id]["icon"],
					"iconclass" => $this->getIconClass(self::$dcache[$acc_id]["icon"])];

		return $res;
	}


	// Try to find account different from specified
	public function getAnother($acc_id)
	{
		$acc_id = intval($acc_id);
		if ($acc_id != 0 && $this->getCount() < 2)
			return 0;

		$newacc_id = $this->getIdByPos(0);
		if ($newacc_id == $acc_id)
			$newacc_id = $this->getIdByPos(1);

		return $newacc_id;
	}
}
