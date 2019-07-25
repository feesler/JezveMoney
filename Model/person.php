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
		self::$owner_id = $uMod->getOwner(self::$user_id);

		$this->dbObj = mysqlDB::getInstance();
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

		$resArr = $this->dbObj->selectQ("*", "persons", "user_id=".self::$user_id);
		foreach($resArr as $row)
		{
			$person_id = $row["id"];

			self::$dcache[$person_id]["name"] = $row["name"];
			self::$dcache[$person_id]["user_id"] = intval($row["user_id"]);
			self::$dcache[$person_id]["createdate"] = strtotime($row["createdate"]);
			self::$dcache[$person_id]["updatedate"] = strtotime($row["updatedate"]);
		}
	}


	// Create new person
	public function create($pname)
	{
		if (is_null($pname) || $pname == "")
			return 0;

		$person_name = $this->dbObj->escape($pname);

		$curDate = date("Y-m-d H:i:s");

		if (!$this->dbObj->insertQ("persons", ["id", "name", "user_id", "createdate", "updatedate"],
								[NULL, $person_name, self::$user_id, $curDate, $curDate]))
			return 0;

		$p_id = $this->dbObj->insertId();

		$this->cleanCache();

		return $p_id;
	}


	// Update person information
	public function edit($p_id, $pname)
	{
		if (!$p_id || !is_numeric($p_id) || !$pname || $pname == "")
			return FALSE;

		$person_id = intval($p_id);
		$person_name = $this->dbObj->escape($pname);

		// check person is exist
		if (!$this->is_exist($person_id))
			return FALSE;

		$curDate = date("Y-m-d H:i:s");

		if (!$this->dbObj->updateQ("persons", ["name", "updatedate"], [$person_name, $curDate], "id=".$person_id))
			return FALSE;

		$this->cleanCache();

		return TRUE;
	}


	// Delete person
	public function del($p_id)
	{
		if (!$p_id || !is_numeric($p_id))
			return FALSE;
		$p_id = intval($p_id);

		// check person is exist
		if (!$this->is_exist($p_id))
			return FALSE;

		$accMod = new AccountModel(self::$user_id, TRUE);
		if (!$accMod->onPersonDelete($p_id))
		{
			wlog("accMod->onPersonDelete(".$p_id.") return FALSE");
			return FALSE;
		}

		// delete person
		if (!$this->dbObj->deleteQ("persons", ["user_id=".self::$user_id, "id=".$p_id]))
			return FALSE;

		$this->cleanCache();

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


	// Return person name by specified id
	public function getName($p_id)
	{
		return $this->getCache($p_id, "name");
	}


	// Return user of specified person
	public function getUser($p_id)
	{
		return $this->getCache($p_id, "user_id");
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

		$resArr = $this->dbObj->selectQ("id", "accounts", $condArr);
		if (count($resArr) != 1)
			return 0;

		return intval($resArr[0]["id"]);
	}


	// Create account of specified currency for person
	public function createAccount($person_id, $curr_id)
	{
		if (!is_numeric($person_id) || !is_numeric($curr_id))
			return 0;

		$p_id = intval($person_id);
		$c_id = intval($curr_id);
		if (!$p_id || !$c_id)
			return 0;

		if (!$this->is_exist($p_id))
			return FALSE;

		$accMod = new AccountModel(self::$user_id);
		return $accMod->create($p_id, "acc_".$p_id."_".$c_id, 0.0, $c_id, 0);
	}


	// Search person with specified name and return id if success
	public function findByName($p_name)
	{
		if (!$this->checkCache())
			return 0;

		foreach(self::$dcache as $p_id => $row)
		{
			if ($p_id != self::$owner_id && $row["name"] == $p_name)
			{
				return $row["name"];
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
		if (!$this->dbObj->deleteQ("persons", $condArr))
			return FALSE;

		$this->cleanCache();

		return TRUE;
	}


	// Return javascript array of persons
	public function getArray()
	{
		$condArr = ["p.user_id=".self::$user_id, "p.id<>".self::$owner_id];
		$resArr = $this->dbObj->selectQ(["p.name" => "name",
									"p.id" => "pid",
									"a.id" => "aid",
									"a.curr_id" => "curr_id",
									"a.balance" => "balance"],
							["persons AS p LEFT JOIN accounts AS a ON a.owner_id=p.id"],
							$condArr);

		$pArr = [];
		foreach($resArr as $row)
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
