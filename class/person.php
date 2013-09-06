<?php

class Person
{
	private $user_id = 0;
	private $owner_id = 0;		// person of user


	// Class constructor
	public function __construct($user_id)
	{
		global $db;

		$this->user_id = intval($user_id);

		$resArr = $db->selectQ("owner_id", "users", "id=".$this->user_id);
		if (count($resArr) == 1)
		{
			$this->owner_id = intval($resArr[0]["owner_id"]);
		}
	}


	// Check is specified account is exist
	public function is_exist($p_id)
	{
		global $db;

		if (!is_numeric($p_id))
			return FALSE;

		$person_id = intval($p_id);
		if (!$person_id)
			return FALSE;

		$resArr = $db->selectQ("id", "persons", "id=".$person_id);
		return (count($resArr) == 1 && intval($resArr[0]["id"]) == $person_id);
	}


	// Create new person
	public function create($pname)
	{
		global $db;

		if (is_null($pname) || $pname == "")
			return 0;

		$person_name = $db->escape($pname);

		if (!$db->insertQ("persons", array("id", "name", "user_id"),
								array(NULL, $person_name, $this->user_id)))
			return 0;

		return $db->insertId();
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

		return TRUE;
	}


	// Return count of persons of current user
	public function getCount()
	{
		global $db;

		$resArr = $db->selectQ("id", "persons", "user_id=".$this->user_id." AND id<>".$this->owner_id);
		return count($resArr);
	}


	// Return HTML string of persons for select control
	public function getList($selected_id = 0)
	{
		global $db;

		$resArr = $db->selectQ("*", "persons", "user_id=".$this->user_id." AND id<>".$this->owner_id);
		foreach($resArr as $row)
		{
			$person_id = $row["id"];

			$resStr = "<option value=\"".$person_id."\"";
			if ($person_id == $selected_id)
				$resStr .= " selected";
			$resStr .= ">".$row["name"]."</option>";

			html($resStr);
		}
	}


	// Return person id by specified position
	public function getIdByPos($pos = 0)
	{
		global $db;

		$resStr = "";

		if (!is_numeric($pos) || $pos < 0)
			return 0;

		$resArr = $db->selectQ("id", "persons", "user_id=".$this->user_id." AND id<>".$this->owner_id);
		return (($pos < count($resArr)) ? intval($resArr[$pos]["id"]) : 0);
	}


	// Return person name by specified id
	public function getName($p_id)
	{
		global $db;

		if (!$p_id || !is_numeric($p_id))
			return "";

		$person_id = intval($p_id);

		$resArr = $db->selectQ("name", "persons", "user_id=".$this->user_id." AND id=".$person_id);
		return ((count($resArr) == 1) ? $resArr[0]["name"] : "");
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
							"user_id=".$this->user_id." AND owner_id=".$p_id." AND curr_id=".$c_id);
		if (count($resArr) > 0)
		{
			return intval($resArr[0]["id"]);
		}
		else
		{
			$acc = new Account($this->user_id);
			if (!$acc->create($p_id, "acc_".$p_id."_".$c_id, 0.0, $c_id))
				return 0;

			$resArr = $db->selectQ("id", "accounts",
								"user_id=".$this->user_id." AND owner_id=".$person_id." AND curr_id=".$curr_id);
			if (count($resArr) > 0)
				return intval($resArr[0]["id"]);
			else
				return 0;
		}
	}


	// Search person with specified name and return id if success
	public function findByName($p_name)
	{
		global $db;

		$e_name = $db->escape($p_name);

		$condition = "user_id=".$this->user_id;		// look only for persons of current user
		$condition .= " AND id<>".$this->owner_id;	// exclude owner person
		$condition .= " AND name=".qnull($e_name);

		$resArr = $db->selectQ("id", "persons", $condition);
		if (count($resArr) != 1)
			return 0;

		return intval($resArr[0]["id"]);
	}


	// Delete all persons except owner of user
	public function reset()
	{
		global $db;

		if (!$db->deleteQ("persons", "user_id=".$this->user_id." AND id<>".$this->owner_id))
			return FALSE;

		return TRUE;
	}


	// Return HTML for table of persons
	public function getTable()
	{
		global $db;

		html_op("<div class=\"trans_list\">");

		$resArr = $db->selectQ("*", "persons", "user_id=".$this->user_id." AND id<>".$this->owner_id);
		$persons = count($resArr);
		if (!$persons)
		{
			html("<span>No persons here.</span>");
		}
		else
		{
			$acc = new Account($this->user_id, TRUE);

			$i = 0;
			foreach($resArr as $row)
			{
				$i++;

				wlog("person: ".$row["name"]);


				$pName = $row["name"];
				$p_id = intval($row["id"]);

				$accArr = $db->selectQ("*", "accounts", "user_id=".$this->user_id." AND owner_id=".$p_id." AND owner_id<>".$this->owner_id);
				$totalArr = array();
				foreach($accArr as $accRow)
				{
					$curr_id = intval($accRow["curr_id"]);

					wlog("account: ".$accRow["name"].", ".$accRow["balance"]." curr: ".$curr_id);

					if (!isset($totalArr[$curr_id]))
						$totalArr[$curr_id] = 0.0;

					$totalArr[$curr_id] += floatval($accRow["balance"]);
				}

				$pBalance = "";
				foreach($totalArr as $curr_id => $bal)
				{
					if ($pBalance != "")
						$pBalance .= "<br>";
					$pBalance .= Currency::format($bal, $curr_id);
				}


				$resStr = "<div class=\"latest";
				if ($i % 2 == 0)
					$resStr .= " even_row";
				$resStr .= "\">";
				html_op($resStr);

				html("<div><span class=\"latest_acc_name\">".$pName."</span></div>");
				html("<div><span class=\"latest_sum\">".$pBalance."</span></div>");

				html_cl("</div>");
			}
		}

		html_cl("</div>");
	}
}

?>