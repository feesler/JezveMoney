<?php

class PersonModel extends CachedTable
{
	static private $dcache = NULL;
	static private $user_id = 0;
	static private $owner_id = 0;		// person of user


	// Class constructor
	public function __construct($user_id)
	{
		if ($user_id != self::$user_id)
			self::$dcache = NULL;
		self::$user_id = intval($user_id);
		// find owner person
		$uMod = new UserModel();
		$uObj = $uMod->getItem(self::$user_id);
		if (!$uObj)
			throw new Error("User not found");

		self::$owner_id = $uObj->owner_id;

		$this->tbl_name = "persons";

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
						"DEFAULT CHARACTER SET = utf8 COLLATE utf8_general_ci");

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
		$res->name = $row["name"];
		$res->format = intval($row["user_id"]);
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

		if (isset($params["name"]))
		{
			$res["name"] = $this->dbObj->escape($params["name"]);
			if (is_empty($res["name"]))
			{
				wlog("Invalid name specified");
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

		$res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");
		$res["user_id"] = self::$user_id;

		return $res;
	}


	// Preparations for item update
	protected function preUpdate($item_id, $params)
	{
		// check person is exist
		$currObj = $this->getItem($item_id);
		if (!$currObj)
			return FALSE;

		$res = $this->checkParams($params, TRUE);
		if (is_null($res))
			return NULL;

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

		$res["updatedate"] = date("Y-m-d H:i:s");

		return $res;
	}


	// Preparations for item delete
	protected function preDelete($item_id)
	{
		// check person is exist
		$currObj = $this->getItem($item_id);
		if (!$currObj)
			return FALSE;

		$accMod = new AccountModel(self::$user_id, TRUE);
		if (!$accMod->onPersonDelete($item_id))
		{
			wlog("accMod->onPersonDelete(".$item_id.") return FALSE");
			return FALSE;
		}

		return TRUE;
	}


	// Return person id by specified position
	public function getIdByPos($pos = 0)
	{
		if (!$this->checkCache())
			return 0;

		if (count(self::$dcache) == 1)		// no persons except user owner
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

		$accMod = new AccountModel(self::$user_id);
		return $accMod->create([ "owner_id" => $p_id,
									"name" => "acc_".$p_id."_".$c_id,
									"balance" => 0.0,
									"curr_id" => $c_id,
									"icon" => 0 ]);
	}


	// Search person with specified name and return id if success
	public function findByName($p_name)
	{
		if (!$this->checkCache())
			return 0;

		foreach($this->cache as $p_id => $item)
		{
			if ($p_id != self::$owner_id && $item->name == $p_name)
			{
				return $p_id;
			}
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


	// Return javascript array of persons
	public function getArray()
	{
		$condArr = ["p.user_id=".self::$user_id, "p.id<>".self::$owner_id];
		$qResult = $this->dbObj->selectQ(["p.name" => "name",
									"p.id" => "pid",
									"a.id" => "aid",
									"a.curr_id" => "curr_id",
									"a.balance" => "balance"],
							["persons AS p LEFT JOIN accounts AS a ON a.owner_id=p.id"],
							$condArr,
						 	NULL, "p.id ASC, a.id ASC");

		$pArr = [];
		while($row = $this->dbObj->fetchRow($qResult))
		{
			$p_id = intval($row["pid"]);

			$ind = NULL;
			foreach($pArr as $pInd => $pVal)
			{
				if ($pVal->id == $p_id)
				{
					$ind = $pInd;
					break;
				}
			}

			if (is_null($ind))
				$ind = count($pArr);

			if (!isset($pArr[$ind]))
			{
				$pArr[$ind] = new stdClass;

				$pArr[$ind]->id = $p_id;
				$pArr[$ind]->name = $row["name"];
				$pArr[$ind]->accounts = [];
			}
			if (!is_null($row["aid"]))
			{
				$pAccObj = new stdClass;

				$pAccObj->id = intval($row["aid"]);
				$pAccObj->curr_id = intval($row["curr_id"]);
				$pAccObj->balance = floatval($row["balance"]);

				$pArr[$ind]->accounts[] = $pAccObj;
			}
		}

		return $pArr;
	}
}
