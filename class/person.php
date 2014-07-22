<?php

class Person extends CachedTable
{
	static private $dcache = NULL;
	static private $user_id = 0;
	static private $owner_id = 0;		// person of user


	// Class constructor
	public function __construct($user_id)
	{
		self::$user_id = intval($user_id);
		// find owner person
		$u = new User();
		self::$owner_id = $u->getOwner(self::$user_id);
	}


	// Return link to cache of derived class
	protected function &getDerivedCache()
	{
		return self::$dcache;
	}


	// Update cache
	protected function updateCache()
	{
		global $db;

		self::$dcache = array();

		$resArr = $db->selectQ("*", "persons", "user_id=".self::$user_id);
		foreach($resArr as $row)
		{
			$person_id = $row["id"];

			self::$dcache[$person_id]["name"] = $row["name"];
			self::$dcache[$person_id]["user_id"] = intval($row["user_id"]);
		}
	}


	// Create new person
	public function create($pname)
	{
		global $db;

		if (is_null($pname) || $pname == "")
			return 0;

		$person_name = $db->escape($pname);

		if (!$db->insertQ("persons", array("id", "name", "user_id"),
								array(NULL, $person_name, self::$user_id)))
			return 0;

		$p_id = $db->insertId();

		$this->cleanCache();

		return $p_id;
	}


	// Update person information
	public function edit($p_id, $pname)
	{
		global $db;

		if (!$p_id || !is_numeric($p_id) || !$pname || $pname == "")
			return FALSE;

		$person_id = intval($p_id);
		$person_name = $db->escape($pname);

		// check person is exist
		if (!$this->is_exist($person_id))
			return FALSE;

		if (!$db->updateQ("persons", array("name"), array($person_name), "id=".$person_id))
			return FALSE;

		$this->cleanCache();

		return TRUE;
	}


	// Delete person
	public function del($p_id)
	{
		global $db;

		if (!$p_id || !is_numeric($p_id))
			return FALSE;
		$p_id = intval($p_id);

		// check person is exist
		if (!$this->is_exist($p_id))
			return FALSE;

		$acc = new Account(self::$user_id, TRUE);
		if (!$acc->onPersonDelete($p_id))
		{
			wlog("acc->onPersonDelete(".$p_id.") return FALSE");
			return FALSE;
		}

		// delete person
		if (!$db->deleteQ("persons", "user_id=".self::$user_id." AND id=".$p_id))
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


	// Return account with specified currency or create new
	public function getAccount($person_id, $curr_id)
	{
		global $db;

		if (!is_numeric($person_id) || !is_numeric($curr_id))
			return 0;

		$p_id = intval($person_id);
		$c_id = intval($curr_id);

		$resArr = $db->selectQ("id", "accounts",
							"user_id=".self::$user_id." AND owner_id=".$p_id." AND curr_id=".$c_id);
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

		$acc = new Account(self::$user_id);
		return $acc->create($p_id, "acc_".$p_id."_".$c_id, 0.0, $c_id, 0);
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
		global $db;

		if (!self::$user_id || !self::$owner_id)
			return FALSE;

		if (!$db->deleteQ("persons", "user_id=".self::$user_id." AND id<>".self::$owner_id))
			return FALSE;

		$this->cleanCache();

		return TRUE;
	}


	// Return javascript array of persons
	public function getArray()
	{
		global $db;

		$resArr = $db->selectQ(array("p.name" => "name",
									"p.id" => "pid",
									"a.id" => "aid",
									"a.curr_id" => "curr_id",
									"a.balance" => "balance"),
							array("persons AS p LEFT JOIN accounts AS a ON a.owner_id=p.id"),
							"p.user_id=".self::$user_id." AND p.id<>".self::$owner_id);

		$pArr = array();
		foreach($resArr as $row)
		{
			$p_id = intval($row["pid"]);
			$p_name = $row["name"];
			$acc_id = intval($row["aid"]);
			$curr_id = intval($row["curr_id"]);
			$balance = floatval($row["balance"]);

			$ind = NULL;
			foreach($pArr as $pInd => $pVal)
			{
				if ($pVal[0] == $p_id)
				{
					$ind = $pInd;
					break;
				}
			}

			if (is_null($ind))
			{
				$pArr[] = array();
				$ind = count($pArr) - 1;
			}

			$pArr[$ind][0] = $p_id;
			$pArr[$ind][1] = $p_name;
			if (!isset($pArr[$ind][2]))
				$pArr[$ind][2] = array();
			if (!is_null($row["aid"]))
				$pArr[$ind][2][] = array($acc_id, $curr_id, $balance);

		}

		return $pArr;
	}
}

?>