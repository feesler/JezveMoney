<?php

class Account
{
	static private $cache = NULL;
	static private $user_id = 0;


	// Class constructor
	function __construct($user_id)
	{
		if ($user_id != self::$user_id)
			self::$cache = NULL;
		self::$user_id = intval($user_id);
	}


	// Update cache
	private function updateCache()
	{
		global $db;

		self::$cache = array();

		$resArr = $db->selectQ("*", "accounts", "user_id=".self::$user_id);
		foreach($resArr as $row)
		{
			$acc_id = $row["id"];

			self::$cache[$acc_id]["name"] = $row["name"];
			self::$cache[$acc_id]["curr_id"] = intval($row["curr_id"]);
			self::$cache[$acc_id]["balance"] = floatval($row["balance"]);
			self::$cache[$acc_id]["initbalance"] = floatval($row["initbalance"]);
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
		$acc_id = intval($acc_id);
		if (!$acc_id)
			return FALSE;

		if (!$this->checkCache())
			return FALSE;

		return isset(self::$cache[$acc_id]);
	}


	// Return currency of account
	public function getCurrency($acc_id)
	{
		return $this->getCache($acc_id, "curr_id");
	}


	// Return name of account
	public function getName($acc_id)
	{
		return $this->getCache($acc_id, "name");
	}


	// Return current balance of account
	public function getBalance($acc_id)
	{
		return $this->getCache($acc_id, "balance");
	}


	// Return name of account
	public function getInitBalance($acc_id)
	{
		return $this->getCache($acc_id, "initbalance");
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


	// Return HTML string of accounts for select control
	public function getList($selected_id = 0)
	{
		$resStr = "";

		if (!$this->checkCache())
			return $resStr;

		foreach(self::$cache as $acc_id => $row)
		{
			$resStr .= "\t\t\t<option value=\"".$acc_id."\"";
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
			$resArr[] = array($acc_id, $row["curr_id"], Currency::getSign($row["curr_id"]), $row["balance"]);
		}

		return "var accounts = ".json_encode($resArr).";\r\n";
	}


	// Return table of user accounts
	public function getTable($transfer = FALSE, $editlink = FALSE)
	{
		$resStr = "";

		if (!$this->checkCache())
			return $resStr;

		$resStr .= "\t<tr>\r\n\t<td>\r\n\t<table class=\"infotable\">\r\n";

		$accounts = count(self::$cache);
		if ((!$accounts && !$transfer) || ($accounts < 2 && $transfer))
		{
			$resStr .= "\t\t<tr><td><span>";
			if ($transfer)
				$resStr .= "You need at least two accounts to transfer.";
			else
				$resStr .= "You have no one account. Please create one.";
			$resStr .= "</span></td></tr>\r\n";
		}
		else
		{
			$resStr .= "\t\t<tr><td><b>Name</b></td><td><b>Currency</b></td><td><b>Balance</b></td>";
			if ($editlink == TRUE)
				$resStr .= "<td></td>";
			$resStr .= "</tr>\r\n";

			$totalArr = array();
			foreach(self::$cache as $acc_id => $row)
			{
				$balfmt = Currency::format($row["balance"], $row["curr_id"]);
				$currname = Currency::getName($row["curr_id"]);

				if ($currname != "" && !$totalArr[$row["curr_id"]])
					$totalArr[$row["curr_id"]] = 0;

				$totalArr[$row["curr_id"]] += $row["balance"];

				$resStr .= "\t\t<tr><td>".$row["name"]."</td><td>".$currname."</td><td style=\"text-align: right;\">".$balfmt."</td>";
				if ($editlink == TRUE)
					$resStr .= "<td><a href=\"./editaccount.php?id=".$acc_id."\">edit</a> <a href=\"./checkbalance.php?id=".$acc_id."\">check</a></td>";
				$resStr .= "</tr>\r\n";
			}

			$resStr .= "\t\t<tr style=\"background-color: transparent;\">";
			$resStr .= "<td colspan=\"".(($editlink == TRUE) ? "4" : "3")."\" style=\"height: 10px;\"></td></tr>\r\n";

			foreach($totalArr as $key => $value)
			{
				$valfmt = Currency::format($value, $key);
				$currname = Currency::getName($key);
				$resStr .= "<tr><td>Total</td><td>".$currname."</td><td style=\"text-align: right;\">".$valfmt."</td>";
				if ($editlink == TRUE)
					$resStr .= "<td></td>";
				$resStr .= "</tr>";
			}
		}

		$resStr .= "\t</table>\r\n\t</td>\r\n\t</tr>\r\n";

		return $resStr;
	}
}

?>