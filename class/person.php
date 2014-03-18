<?php

class Person
{
	static private $cache = NULL;
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


	// Update cache
	private function updateCache()
	{
		global $db;

		self::$cache = array();

		$resArr = $db->selectQ("*", "persons", "user_id=".self::$user_id);
		foreach($resArr as $row)
		{
			$person_id = $row["id"];

			self::$cache[$person_id]["name"] = $row["name"];
			self::$cache[$person_id]["user_id"] = intval($row["user_id"]);
		}
	}


	// Check state of cache and update if needed
	private function checkCache()
	{
		if (is_null(self::$cache))
			$this->updateCache();

		return (!is_null(self::$cache));
	}


	// Return value of specified person from cache
	private function getCache($p_id, $val)
	{
		$p_id = intval($p_id);
		if (!$p_id || !$val)
			return NULL;

		if (!$this->checkCache())
			return NULL;

		if (!isset(self::$cache[$p_id]))
			return NULL;

		return self::$cache[$p_id][$val];
	}


	// Return count of persons
	public function getCount()
	{
		if (!$this->checkCache())
			return 0;

		return count(self::$cache);
	}


	// Check is specified person is exist
	public function is_exist($p_id)
	{
		if (!is_numeric($p_id))
			return FALSE;

		$p_id = intval($p_id);
		if (!$p_id)
			return FALSE;

		if (!$this->checkCache())
			return FALSE;

		return isset(self::$cache[$p_id]);
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

		self::updateCache();

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

		self::updateCache();

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

		self::updateCache();

		return TRUE;
	}


	// Return HTML string of persons for select control
	public function getList($selected_id = 0)
	{
		if (!$this->checkCache())
			return;

		foreach(self::$cache as $person_id => $row)
		{
			if ($person_id != self::$owner_id)
			{
				$resStr = "<option value=\"".$person_id."\"";
				if ($person_id == $selected_id)
					$resStr .= " selected";
				$resStr .= ">".$row["name"]."</option>";

				html($resStr);
			}
		}
	}


	// Return person id by specified position
	public function getIdByPos($pos = 0)
	{
		if (!$this->checkCache())
			return 0;

		if (count(self::$cache) == 1)		// no persons except user owner
			return 0;

		$keys = array_keys(self::$cache);
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

		foreach(self::$cache as $p_id => $row)
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

		self::updateCache();

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
							array("persons" => "p", "accounts" => "a"),
							"p.user_id=".self::$user_id." AND p.id<>".self::$owner_id." AND a.owner_id=p.id");
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
			$pArr[$ind][2][] = array($acc_id, $curr_id, $balance);

		}

		html("var persons = ".json_encode($pArr).";");
	}


	// Return HTML for person tile
	public function getTileEx($tile_type, $person_id, $bal_corr, $tile_id = "")
	{
		if (!$this->is_exist($person_id))
			return "";

		if ($tile_id == "")
			$tile_id = "p_".$person_id;

		$b_corr = floatVal($bal_corr);

		$acc_name = $this->getName($person_id);

		$tile_act = NULL;
		if ($tile_type == LINK_TILE)
			$tile_act = "./newtransaction.php?type=debt";
		else if ($tile_type == BUTTON_TILE)
			$tile_act = "onTileClick(".$person_id.");";

		return getTile($tile_type, $tile_id, $acc_name, "", $tile_act);
	}


	// Return HTML for person tile
	public function getTile($tile_type, $person_id, $tile_id = "")
	{
		return $this->getTileEx($tile_type, $person_id, 0.0, $tile_id);
	}


	// Return HTML for persons of user
	public function getTiles($buttons = FALSE)
	{
		$resStr = "";

		$tileType = ($buttons) ? BUTTON_TILE : LINK_TILE;

		if ($this->getCount() < 2)
		{
			$resStr .= "<span>You have no one person. Please create one.</span>";
		}
		else
		{
			foreach(self::$cache as $p_id => $row)
			{
				if ($p_id != self::$owner_id)
				{
					$resStr .= $this->getTile($tileType, $p_id);
				}
			}
		}

		return $resStr;
	}


	// Return HTML for table of persons
	public function getTable()
	{
		global $db;

		html_op("<div>");

		if ($this->getCount() < 2)
		{
			html("<span>No persons here.</span>");
		}
		else
		{
			$acc = new Account(self::$user_id, TRUE);

			foreach(self::$cache as $p_id => $row)
			{
				if ($p_id == self::$owner_id)
					continue;

				$pName = $row["name"];

				$accArr = $db->selectQ("*", "accounts", "user_id=".self::$user_id." AND owner_id=".$p_id." AND owner_id<>".self::$owner_id);
				$totalArr = array();
				foreach($accArr as $accRow)
				{
					$curr_id = intval($accRow["curr_id"]);

					if (!isset($totalArr[$curr_id]))
						$totalArr[$curr_id] = 0.0;

					$totalArr[$curr_id] += floatval($accRow["balance"]);
				}

				$pBalance = "";
				$noDebts = TRUE;
				foreach($totalArr as $curr_id => $bal)
				{
					if ($bal != 0.0)
					{
						$noDebts = FALSE;
						if ($pBalance != "")
							$pBalance .= "<br>";
						$pBalance .= Currency::format($bal, $curr_id);
					}
				}

				if ($noDebts)
					$pBalance = "No debts";

				html_op("<div class=\"info_tile\">");
					html("<span class=\"info_title\">".$pName."</span>");
					html("<span class=\"info_subtitle\">".$pBalance."</span>");
				html_cl("</div>");
			}
		}

		html_cl("</div>");
	}
}

?>