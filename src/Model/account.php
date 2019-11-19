<?php

class AccountModel extends CachedTable
{
	static private $dcache = NULL;
	static private $user_id = 0;
	static private $owner_id = 0;
	static private $icons = ["No icon", "Purse", "Safe", "Card", "Percent", "Bank", "Cash"];
	static private $iconClass = ["", "purse_icon", "safe_icon", "card_icon", "percent_icon", "bank_icon", "cash_icon"];


	// Class constructor
	public function __construct($user_id)
	{
		if ($user_id != self::$user_id)
			self::$dcache = NULL;

		$this->tbl_name = "accounts";

		self::$user_id = intval($user_id);

		$uMod = new UserModel();
		$uObj = $uMod->getItem(self::$user_id);
		if (!$uObj)
			throw new Error("User not found");

		self::$owner_id = $uObj->owner_id;

		$this->dbObj = mysqlDB::getInstance();
		if (!$this->dbObj->isTableExist($this->tbl_name))
			$this->createTable();

		$this->currMod = new CurrencyModel();
		$this->personMod = new PersonModel(self::$user_id);
	}


	// Create DB table if not exist
	private function createTable()
	{
		$res = $this->dbObj->createTableQ($this->tbl_name,
						"`id` INT(11) NOT NULL AUTO_INCREMENT, ".
						"`owner_id` INT(11) NOT NULL, ".
						"`user_id` INT(11) NOT NULL, ".
						"`curr_id` INT(11) NOT NULL, ".
						"`balance` DECIMAL(15,2) NOT NULL, ".
						"`initbalance` DECIMAL(15,2) NOT NULL, ".
						"`name` VARCHAR(255) NOT NULL, ".
						"`icon` INT(11) NOT NULL DEFAULT '0', ".
						"`createdate` DATETIME NOT NULL, ".
						"`updatedate` DATETIME NOT NULL, ".
						"PRIMARY KEY (`id`), ".
						"KEY `user_id` (`user_id`)",
						"DEFAULT CHARACTER SET = utf8 COLLATE utf8mb4_general_ci");

		return $res;
	}


	// Return link to cache of derived class
	protected function &getDerivedCache()
	{
		return self::$dcache;
	}


	// Convert DB row to item object
	protected function rowToObj($row)
	{
		if (is_null($row))
			return NULL;

		$res = new stdClass;
		$res->id = intval($row["id"]);
		$res->user_id = intval($row["user_id"]);
		$res->name = $row["name"];
		$res->owner_id = intval($row["owner_id"]);
		$res->curr_id = intval($row["curr_id"]);
		$res->balance = floatval($row["balance"]);
		$res->initbalance = floatval($row["initbalance"]);
		$res->icon = intval($row["icon"]);
		$res->createdate = strtotime($row["createdate"]);
		$res->updatedate = strtotime($row["updatedate"]);

		return $res;
	}


	// Called from CachedTable::updateCache() and return data query object
	protected function dataQuery()
	{
		return $this->dbObj->selectQ("*", $this->tbl_name, "user_id=".self::$user_id, NULL, "id ASC");
	}


	protected function checkParams($params, $isUpdate = FALSE)
	{
		$avFields = ["owner_id", "name", "balance", "curr_id", "icon"];
		$res = [];

		if (!$isUpdate)
		{
			foreach($avFields as $field)
			{
				if (!isset($params[$field]))
				{
					wlog($field." parameter not found");
					return NULL;
				}
			}
		}

		if (isset($params["owner_id"]))
		{
			$res["owner_id"] = intval($params["owner_id"]);
			if (!$res["owner_id"])
			{
				wlog("Invalid owner_id specified");
				return NULL;
			}
		}

		if (isset($params["name"]))
		{
			$res["name"] = $this->dbObj->escape($params["name"]);
			if (is_empty($res["name"]))
			{
				wlog("Invalid name specified");
				return NULL;
			}
		}

		if (isset($params["balance"]))
		{
			$res["balance"] = floatval($params["balance"]);
		}

		if (isset($params["curr_id"]))
		{
			$res["curr_id"] = intval($params["curr_id"]);
			if (!$this->currMod->is_exist($res["curr_id"]))
			{
				wlog("Invalid curr_id specified");
				return NULL;
			}
		}

		if (isset($params["icon"]))
		{
			$res["icon"] = intval($params["icon"]);
			if ($res["icon"] < 0 || $res["icon"] > count(self::$iconClass))
			{
				wlog("Invalid icon specified");
				return NULL;
			}
		}

		return $res;
	}


	// Preparations for item create
	protected function preCreate($params)
	{
		$res = $this->checkParams($params);
		if (is_null($res))
			return NULL;

		$qResult = $this->dbObj->selectQ("*", $this->tbl_name, "name=".qnull($res["name"]));
		if ($this->dbObj->rowsCount($qResult) > 0)
		{
			wlog("Such item already exist");
			return NULL;
		}

		$res["initbalance"] = $res["balance"];
		$res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");
		$res["user_id"] = self::$user_id;

		return $res;
	}


	// Preparations for item update
	protected function preUpdate($item_id, $params)
	{
		// check account is exist
		$accObj = $this->getItem($item_id);
		if (!$accObj)
			return FALSE;

		// check user of account
		if ($accObj->user_id != self::$user_id)
			return FALSE;

		$res = $this->checkParams($params, TRUE);
		if (is_null($res))
			return NULL;

		if (isset($res["name"]))
		{
			$qResult = $this->dbObj->selectQ("*", $this->tbl_name, "name=".qnull($res["name"]));
			$row = $this->dbObj->fetchRow($qResult);
			if ($row)
			{
				$found_id = intval($row["id"]);
				if ($found_id != $item_id)
				{
					wlog("Such item already exist");
					return NULL;
				}
			}
		}

		// get initial balance to calc difference
		$diff = round($res["balance"] - $accObj->initbalance, 2);

		if (abs($diff) >= 0.01)
		{
			$res["balance"] = $accObj->balance + $diff;
			$res["initbalance"] = $res["balance"];
		}
		else
		{
			unset($res["balance"]);
			unset($res["initbalance"]);
		}

		$res["updatedate"] = date("Y-m-d H:i:s");

		return $res;
	}


	// Preparations for item delete
	protected function preDelete($item_id)
	{
		// check account is exist
		$accObj = $this->getItem($item_id);
		if (!$accObj)
			return FALSE;

		// check user of account
		if ($accObj->user_id != self::$user_id)
			return FALSE;

		$transMod = new TransactionModel(self::$user_id);
		if (!$transMod->onAccountDelete($item_id))
		{
			wlog("trans->onAccountDelete(".$item_id.") return FALSE");
			return FALSE;
		}

		return TRUE;
	}


	// Remove accounts of specified person
	public function onPersonDelete($p_id)
	{
		if (!$this->checkCache())
			return FALSE;

		foreach($this->cache as $acc_id => $item)
		{
			if ($item->owner_id == $p_id)
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

		$newValue = $this->dbObj->escape($newValue);

		if (!$this->update($acc_id,
							[ $field => $newValue,
								"updatedate" => date("Y-m-d H:i:s") ]))
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
		if (!$this->dbObj->deleteQ($this->tbl_name, "user_id=".self::$user_id))
			return FALSE;

		$this->cleanCache();

		return TRUE;
	}


	// Set balance of account
	public function setBalance($acc_id, $balance)
	{
		return $this->update($acc_id, [ "balance" => $balance ]);
	}


	// Return name of account if owner is user or name of person else
	public function getNameOrPerson($acc_id)
	{
		$accObj = $this->getItem($acc_id);
		if (!$accObj || !isset($accObj->owner_id))
			return NULL;

		if (self::$owner_id == $accObj->owner_id)
		{
			return $accObj->name;
		}
		else
		{
			$pObj = $this->personMod->getItem($accObj->owner_id);
			if (!$pObj)
				return NULL;

			return $pObj->name;
		}
	}


	// Return array of icons
	public function getIconsArray()
	{
		return self::$icons;
	}


	// Return array of accounts
	public function getData($params = NULL)
	{
		$resArr = [];

		if (!$this->checkCache())
			return $resArr;

		$includePersons = (is_array($params) && isset($params["full"]) && $params["full"] == TRUE);

		foreach($this->cache as $acc_id => $item)
		{
			if (!$includePersons && $item->owner_id != self::$owner_id)
				continue;

			$accObj = clone $item;

			$resArr[] = $accObj;
		}

		return $resArr;
	}


	// Return count of objects
	public function getCount($params = NULL)
	{
		$res = 0;

		if (!$this->checkCache())
			return $res;

		$includePersons = (is_array($params) && isset($params["full"]) && $params["full"] == TRUE);

		foreach($this->cache as $acc_id => $item)
		{
			if (!$includePersons && $item->owner_id != self::$owner_id)
				continue;

			$res++;
		}

		return $res;
	}


	// Return array of accounts for template
	public function getTilesArray()
	{
		$res = [];

		if (!$this->checkCache())
			return $res;

		$accounts = count($this->cache);

		foreach($this->cache as $acc_id => $item)
		{
			if ($item->owner_id != self::$owner_id)
				continue;

			$acc_icon = $this->getIconClass($item->icon);
			$balance_fmt = $this->currMod->format($item->balance, $item->curr_id);

			$res[$acc_id] = ["name" => $item->name,
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

		foreach($this->cache as $acc_id => $item)
		{
			if ($item->owner_id != self::$owner_id)
				continue;

			$currObj = $this->currMod->getItem($item->curr_id);
			if (!$currObj)
				return NULL;

			if (!isset($res[$item->curr_id]))
				$res[$item->curr_id] = 0;

			$res[$item->curr_id] += $item->balance;
		}

		return $res;
	}


	// Build array with properties of account
	public function getProperties($acc_id)
	{
		$accObj = $this->getItem($acc_id);
		if (!$accObj)
			return NULL;

		$res = new stdClass;
		$res->id = $accObj->id;
		$res->owner = $accObj->owner_id;		// TODO : use owner_id
		$res->name = $accObj->name;
		$res->balance = $accObj->balance;
		$res->initbalance = $accObj->initbalance;
		$res->curr = $accObj->curr_id;			// TODO : use curr_id

		$currObj = $this->currMod->getItem($accObj->curr_id);
		$res->sign = ($currObj) ? $currObj->sign : NULL;
		$res->icon = $accObj->icon;
		$res->iconclass = $this->getIconClass($accObj->icon);

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
