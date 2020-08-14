<?php

class AccountModel extends CachedTable
{
	use Singleton;
	use CachedInstance;

	static private $user_id = 0;
	static private $owner_id = 0;
	static private $icons = ["No icon", "Purse", "Safe", "Card", "Percent", "Bank", "Cash"];
	static private $iconClass = ["", "purse_icon", "safe_icon", "card_icon", "percent_icon", "bank_icon", "cash_icon"];
	static private $iconNames = [NULL, "purse", "safe", "card", "percent", "bank", "cash"];


	protected function onStart()
	{
		$this->tbl_name = "accounts";

		$uMod = UserModel::getInstance();
		self::$user_id = $uMod->getUser();
		if (!self::$user_id)
			throw new Error("User not found");

		self::$owner_id = $uMod->getOwner();

		$this->dbObj = MySqlDB::getInstance();
		if (!$this->dbObj->isTableExist($this->tbl_name))
			$this->createTable();

		$this->currMod = CurrencyModel::getInstance();
		$this->personMod = PersonModel::getInstance();
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
		$avFields = ["owner_id", "name", "initbalance", "curr_id", "icon"];
		$res = [];

		// In CREATE mode all fields is required
		if (!$isUpdate && !checkFields($params, $avFields))
			return NULL;

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

		if (isset($params["initbalance"]))
		{
			$res["initbalance"] = floatval($params["initbalance"]);
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
	protected function preCreate($params, $isMultiple = FALSE)
	{
		$res = $this->checkParams($params);
		if (is_null($res))
			return NULL;

		$foundItem = $this->findByName($res["name"]);
		if ($foundItem)
		{
			wlog("Such item already exist");
			return NULL;
		}

		$res["balance"] = $res["initbalance"];
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
			$foundItem = $this->findByName($res["name"]);
			if ($foundItem && $foundItem->id != $item_id)
			{
				wlog("Such item already exist");
				return NULL;
			}
		}

		$this->currencyUpdated = (isset($res["curr_id"]) && $res["curr_id"] != $accObj->curr_id);

		// get initial balance to calc difference
		$diff = round($res["initbalance"] - $accObj->initbalance, 2);
		if (abs($diff) >= 0.01)
		{
			$this->balanceUpdated = TRUE;
			$res["balance"] = $accObj->balance + $diff;
		}
		else
		{
			$this->balanceUpdated = FALSE;
			unset($res["balance"]);
			unset($res["initbalance"]);
		}

		$res["updatedate"] = date("Y-m-d H:i:s");

		return $res;
	}


	protected function postUpdate($item_id)
	{
		$this->cleanCache();

		if ($this->currencyUpdated || $this->balanceUpdated)
		{
			$transMod = TransactionModel::getInstance();

			$transMod->onAccountUpdate($item_id);
		}

		unset($this->currencyUpdated);
		unset($this->balanceUpdated);
	}


	// Preparations for item delete
	protected function preDelete($items)
	{
		$this->removedItems = [];

		foreach($items as $item_id)
		{
			// check account is exist
			$accObj = $this->getItem($item_id);
			if (!$accObj)
				return FALSE;

			// check user of account
			if ($accObj->user_id != self::$user_id)
				return FALSE;

			$this->removedItems[] = $accObj;
		}

		return TRUE;
	}


	protected function postDelete($items)
	{
		$this->cleanCache();

		$transMod = TransactionModel::getInstance();

		$res = $transMod->onAccountDelete($this->removedItems);
		unset($this->removedItems);

		return $res;
	}


	// Return account of person with specified currency if exist
	public function getPersonAccount($person_id, $curr_id)
	{
		$person_id = intval($person_id);
		if ($person_id == self::$owner_id || !$this->personMod->is_exist($person_id))
		{
			wlog("Invalid person specified");
			return NULL;
		}

		$curr_id = intval($curr_id);
		if (!$this->currMod->is_exist($curr_id))
		{
			wlog("Invalid currency specified");
			return NULL;
		}

		if (!$this->checkCache())
			return FALSE;

		foreach($this->cache as $item)
		{
			if ($item->owner_id == $person_id && $item->curr_id == $curr_id)
				return $item;
		}

		return NULL;
	}


	// Create account with specified currency for person
	public function createPersonAccount($person_id, $curr_id)
	{
		$person_id = intval($person_id);
		if ($person_id == self::$owner_id || !$this->personMod->is_exist($person_id))
		{
			wlog("Invalid person specified");
			return NULL;
		}

		$curr_id = intval($curr_id);
		if (!$curr_id)
		{
			wlog("Invalid currency specified");
			return NULL;
		}

		$createRes = $this->create([
							"owner_id" => $person_id,
							"name" => "acc_".$person_id."_".$curr_id,
							"initbalance" => 0.0,
							"curr_id" => $curr_id,
							"icon" => 0
						]);

		return $this->getItem($createRes);
	}


	// Remove accounts of specified person(s)
	public function onPersonDelete($persons)
	{
		if (is_null($persons))
			return;
		if (!is_array($persons))
			$persons = [ $persons ];

		if (!$this->checkCache())
			return FALSE;

		$accToDel = [];
		foreach($this->cache as $acc_id => $item)
		{
			if (in_array($item->owner_id, $persons))
				$accToDel[] = $acc_id;
		}

		return $this->del($accToDel);
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
	public function reset($users = NULL)
	{
		if (is_null($users))
			$users = self::$user_id;
		if (!is_array($users))
			$users = [ $users ];

		// Normal user may reset only self data
		if (!UserModel::isAdminUser() && (count($users) != 1 || $users[0] != self::$user_id))
			return FALSE;

		$setCond = inSetCondition($users);
		if (is_null($setCond))
			return TRUE;

		// delete all transactions of user
		if (!$this->dbObj->deleteQ("transactions", "user_id".$setCond))
			return FALSE;

		// delete all accounts of user
		if (!$this->dbObj->deleteQ($this->tbl_name, "user_id".$setCond))
			return FALSE;

		$this->cleanCache();

		return TRUE;
	}


	// Set balance of account
	public function setBalance($acc_id, $balance)
	{
		$accObj = $this->getItem($acc_id);
		if (!$accObj)
			return NULL;

		if (!$this->dbObj->updateQ($this->tbl_name, [ "balance" => $balance ], "id=".$acc_id))
			return FALSE;

		$this->cleanCache();

		return TRUE;
	}


	public function updateBalances($balanceChanges)
	{
		$curDate = date("Y-m-d H:i:s");
		$accounts = [];
		foreach($balanceChanges as $acc_id => $balance)
		{
			$accObj = $this->getItem($acc_id);
			if (!$accObj)
				return NULL;

			$accObj->balance = $balance;
			$accObj->createdate = date("Y-m-d H:i:s", $accObj->createdate);
			$accObj->updatedate = $curDate;

			$accounts[] = (array)$accObj;
		}

		if (count($accounts) == 1)
		{
			$account = $accounts[0];
			$this->setBalance($account["id"], $account["balance"]);
		}
		else
		{
			if (!$this->dbObj->updateMultipleQ($this->tbl_name, $accounts))
				return FALSE;

			$this->cleanCache();
		}

		return TRUE;
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

		if (!is_array($params))
			$params = [];

		$includePersons = (isset($params["full"]) && $params["full"] == TRUE);
		$person_id = (isset($params["person"])) ? intval($params["person"]) : 0;
		if ($person_id)
			$includePersons = TRUE;

		$itemsData = [];
		if ($person_id && !$this->personMod->is_exist($person_id) && UserModel::isAdminUser())
		{
			$qResult = $this->dbObj->selectQ("*", $this->tbl_name, NULL, NULL, "id ASC");
			while($row = $this->dbObj->fetchRow($qResult))
			{
				$obj = $this->rowToObj($row);
				if (!is_null($obj))
					$itemsData[$obj->id] = $obj;
			}
		}
		else
		{
			$itemsData = $this->cache;
		}

		foreach($itemsData as $acc_id => $item)
		{
			if ($person_id && $item->owner_id != $person_id)
				continue;
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
								"icon" => $acc_icon,
								"iconname" => $this->getIconName($item->icon)];
		}

		return $res;
	}


	// Return class for specified icon
	public function getIconClass($icon_id)
	{
		$icon_id = intval($icon_id);

		return ($icon_id != 0 && isset(self::$iconClass[$icon_id])) ? " tile_icon ".self::$iconClass[$icon_id] : "";
	}


	// Return name of specified icon
	public function getIconName($icon_id)
	{
		$icon_id = intval($icon_id);

		if (isset(self::$iconNames[$icon_id]))
			return self::$iconNames[$icon_id];
		else
			return NULL;
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


	public function findByName($acc_name, $caseSens = FALSE)
	{
		if (is_empty($acc_name))
			return NULL;
		
		if (!$this->checkCache())
			return NULL;

		if (!$caseSens)
			$acc_name = strtolower($acc_name);
		foreach($this->cache as $item)
		{
			// Skip accounts of persons
			if ($item->owner_id != self::$owner_id)
				continue;

			if (($caseSens && $item->name == $acc_name) ||
				(!$caseSens && strtolower($item->name) == $acc_name))
				return $item;
		}

		return NULL;
	}
}
