<?php

class PersonModel extends CachedTable
{
	use Singleton;
	use CachedInstance;

	static private $user_id = 0;
	static private $owner_id = 0;		// person of user


	protected function onStart()
	{
		// find owner person
		$uMod = UserModel::getInstance();
		self::$user_id = $uMod->getUser();
		self::$owner_id = $uMod->getOwner();

		$this->tbl_name = "persons";
		$this->adminForce = FALSE;

		$this->dbObj = mysqlDB::getInstance();
		if (!$this->dbObj->isTableExist($this->tbl_name))
			$this->createTable();
	}


	// Create DB table if not exist
	private function createTable()
	{
		wlog("PersonModel::createTable()");

		$res = $this->dbObj->createTableQ($this->tbl_name,
						"`id` INT(11) NOT NULL AUTO_INCREMENT, ".
						"`name` VARCHAR(255) NOT NULL, ".
						"`user_id` INT(11) NOT NULL, ".
						"`createdate` DATETIME NOT NULL, ".
						"`updatedate` DATETIME NOT NULL, ".
						"PRIMARY KEY (`id`)",
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
		$res->name = $row["name"];
		$res->user_id = intval($row["user_id"]);
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
		$avFields = ["name"];
		$res = [];

		// In CREATE mode all fields is required
		if (!$isUpdate && !checkFields($params, $avFields))
			return NULL;

		if (isset($params["name"]))
		{
			$res["name"] = $this->dbObj->escape($params["name"]);
			if (is_empty($res["name"]))
			{
				wlog("Invalid name specified");
				return NULL;
			}
		}

		// Registration/admin case
		if (isset($params["user_id"]))
		{
			$res["user_id"] = intval($params["user_id"]);
			if (!$res["user_id"] ||
				(self::$user_id && $res["user_id"] != self::$user_id && !UserModel::isAdminUser()))
			{
				wlog("Invalid user_id");
				return NULL;
			}
		}
		else if (self::$user_id)
		{
			$res["user_id"] = self::$user_id;
		}
		else
		{
			wlog("Can't obtain user_id");
			return NULL;
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

		$res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");

		return $res;
	}


	public function adminUpdate($item_id, $params)
	{
		if (!UserModel::isAdminUser())
			return FALSE;

		$this->adminForce = TRUE;
		$res = $this->update($item_id, $params);
		$this->adminForce = FALSE;

		return $res;
	}


	// Preparations for item update
	protected function preUpdate($item_id, $params)
	{
		// check person is exist
		$personObj = $this->getItem($item_id);
		if (!$personObj)
			return FALSE;

		// check user of person
		if (!$this->adminForce && $personObj->user_id != self::$user_id)
			return FALSE;

		$res = $this->checkParams($params, TRUE);
		if (is_null($res))
			return NULL;

		$foundItem = $this->findByName($res["name"]);
		if ($foundItem && $foundItem->id != $item_id)
		{
			wlog("Such item already exist");
			return NULL;
		}

		$res["updatedate"] = date("Y-m-d H:i:s");

		return $res;
	}


	public function adminDelete($items)
	{
		if (!UserModel::isAdminUser())
			return FALSE;

		$this->adminForce = TRUE;
		$res = $this->del($items);
		$this->adminForce = FALSE;

		return $res;
	}


	// Preparations for items delete
	protected function preDelete($items)
	{
		$accMod = AccountModel::getInstance();

		foreach($items as $item_id)
		{
			// check person is exist
			$pObj = $this->getItem($item_id);
			if (!$pObj)
				return FALSE;

			// check user of person
			if (!$this->adminForce && $pObj->user_id != self::$user_id)
				return FALSE;
		}

		return $accMod->onPersonDelete($items);
	}


	// Return person id by specified position
	public function getIdByPos($pos = 0)
	{
		if (!$this->checkCache())
			return 0;

		// Check user not logged in or there is only user owner person
		if (!self::$owner_id || count(self::$dcache) == 1)
			return 0;

		$keys = array_keys(self::$dcache);
		if (isset($keys[$pos]))
		{
			if ($keys[$pos] == self::$owner_id)
				return ($pos < count($keys) - 1) ? $keys[$pos + 1] : $keys[$pos - 1];
			else
				return $keys[$pos];
		}

		return 0;
	}


	// Return account with specified currency if exist
	public function getAccount($person_id, $curr_id)
	{
		if (!is_numeric($person_id) || !is_numeric($curr_id))
			return 0;

		$p_id = intval($person_id);
		$c_id = intval($curr_id);

		$condArr = ["user_id=".self::$user_id,
						"owner_id=".$p_id,
						"curr_id=".$c_id];

		$qResult = $this->dbObj->selectQ("id", "accounts", $condArr);
		if ($this->dbObj->rowsCount($qResult) != 1)
			return 0;

		$row = $this->dbObj->fetchRow($qResult);

		return intval($row["id"]);
	}


	// Create account of specified currency for person
	public function createAccount($person_id, $curr_id)
	{
		$p_id = intval($person_id);
		$c_id = intval($curr_id);
		if (!$p_id || !$c_id)
			return 0;

		if (!$this->is_exist($p_id))
			return FALSE;

		$accMod = AccountModel::getInstance();
		return $accMod->create([ "owner_id" => $p_id,
									"name" => "acc_".$p_id."_".$c_id,
									"balance" => 0.0,
									"curr_id" => $c_id,
									"icon" => 0 ]);
	}


	// Search person with specified name and return id if success
	public function findByName($p_name, $caseSens = FALSE)
	{
		if (is_empty($p_name))
			return NULL;

		if (!$this->checkCache())
			return 0;

		if (!$caseSens)
			$p_name = strtolower($p_name);
		foreach($this->cache as $p_id => $item)
		{
			// Skip person of user
			if ($p_id == self::$owner_id)
				continue;
			
			if (($caseSens && $item->name == $p_name) ||
				(!$caseSens && strtolower($item->name) == $p_name))
				return $item;
		}

		return 0;
	}


	// Delete all persons except owner of user
	public function reset()
	{
		if (!self::$user_id || !self::$owner_id)
			return FALSE;

		$condArr = ["user_id=".self::$user_id, "id<>".self::$owner_id];
		if (!$this->dbObj->deleteQ($this->tbl_name, $condArr))
			return FALSE;

		$this->cleanCache();

		return TRUE;
	}


	public function getItem($obj_id)
	{
		$item = parent::getItem($obj_id);
		if (is_null($item) && intval($obj_id) && UserModel::isAdminUser())
		{
			$qResult = $this->dbObj->selectQ("*", $this->tbl_name, "id=".intval($obj_id));
			$row = $this->dbObj->fetchRow($qResult);
			$item = $this->rowToObj($row);
		}

		return $item;
	}


	// Return count of objects
	public function getCount($params = NULL)
	{
		if (!is_array($params))
			$params = [];

		$userRequest = isset($params["user"]) ? intval($params["user"]) : 0;

		if ($userRequest && UserModel::isAdminUser())
		{
			$uMod = UserModel::getInstance();
			$uObj = $uMod->getItem($userRequest);
			if (!$uObj)
				return 0;

			return $this->dbObj->countQ($this->tbl_name, [ "user_id=".$userRequest, "id<>".$uObj->owner_id ]);
		}
		else
		{
			return parent::getCount();
		}
	}


	// Return javascript array of persons
	public function getData($params = NULL)
	{
		if (!is_array($params))
			$params = [];

		$accMod = AccountModel::getInstance();
		$requestAll = (isset($params["full"]) && $params["full"] == TRUE && UserModel::isAdminUser());

		$condArr = [];
		if (!$requestAll)
		{
			$condArr[] = "user_id=".self::$user_id;
			$condArr[] = "id<>".self::$owner_id;
		}

		$res = [];

		$qResult = $this->dbObj->selectQ("*", $this->tbl_name, $condArr, NULL, "id ASC");
		while($row = $this->dbObj->fetchRow($qResult))
		{
			$itemObj = $this->rowToObj($row);
			if (!$itemObj)
				continue;

			unset($itemObj->createdate);
			unset($itemObj->updatedate);

			$itemObj->accounts = $accMod->getData([ "person" => $itemObj->id ]);

			$res[] = $itemObj;
		}

		return $res;
	}
}
