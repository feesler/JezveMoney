<?php

class Currency
{
	static private $cache = NULL;


	// Update cache
	private static function updateCache()
	{
		global $db;

		self::$cache = array();

		$resArr = $db->selectQ("*", "currency");
		foreach($resArr as $row)
		{
			$curr_id = $row["id"];

			self::$cache[$curr_id]["name"] = $row["name"];
			self::$cache[$curr_id]["sign"] = $row["sign"];
			self::$cache[$curr_id]["format"] = $row["format"];
		}
	}


	// Check state of cache and update if needed
	private static function checkCache()
	{
		if (is_null(self::$cache))
			self::updateCache();
		return (!is_null(self::$cache));
	}


	// Return value of specified currency from cache
	private static function getCache($curr_id, $val)
	{
		if (!$curr_id || !$val)
			return NULL;

		if (!self::checkCache())
			return NULL;

		if (is_null(self::$cache) || is_null(self::$cache[$curr_id]))
			return NULL;

		return self::$cache[$curr_id][$val];
	}


	// Return name of specified currency
	public static function getName($curr_id)
	{
		return self::getCache($curr_id, "name");
	}


	// Return sign of specified currency
	public static function getSign($curr_id)
	{
		return self::getCache($curr_id, "sign");
	}


	// Return format of specified currency
	public static function getFormat($curr_id)
	{
		return self::getCache($curr_id, "format");
	}


	// Format value in specified currency
	public static function format($value, $curr_id)
	{
		$fmt = self::getFormat($curr_id);

		return valFormat((is_null($fmt) ? "" : $fmt), $value);
	}


	// Return HTML string of currencies for select control
	public static function getList($selected_id = 0)
	{
		$resStr = "";

		if (!self::checkCache())
			return $resStr;

		foreach(self::$cache as $curr_id => $row)
		{
			$resStr .= "\t\t\t<option value=\"".$curr_id."\"";
			if ($curr_id == $selected_id)
				$resStr .= " selected";
			$resStr .= ">".$row["name"]."</option>\r\n";
		}

		return $resStr;
	}


	// Return Javascript array of currencies
	public static function getArray()
	{
		if (!self::checkCache())
			return "";

		$resArr = array();

		foreach(self::$cache as $curr_id => $row)
		{
			$resArr[] = array($curr_id, $row["name"], $row["sign"]);
		}

		return "var currency = ".json_encode($resArr).";\r\n";
	}
}


/*
	// Format value in specified currency
	function currFormat($value, $curr_id)
	{
		global $db;

		$resArr = $db->selectQ("format", "currency", "id=".$curr_id);
		return valFormat((count($resArr) == 1) ? $resArr[0]["format"] : "", $value);
	}


	// Return currency name
	function getCurrencyName($curr_id)
	{
		global $db;

		$resArr = $db->selectQ("name", "currency", "id=".$curr_id);

		return ((count($resArr) == 1) ? $resArr[0]["name"] : "");
	}


	// Return HTML string of currencies for select control
	function getCurrencyList($selected_id = 0)
	{
		global $db;

		$resStr = "";

		$resArr = $db->selectQ("*", "currency");
		foreach($resArr as $row)
		{
			$resStr .= "\t\t\t<option value=\"".$row["id"]."\"";
			if ($row["id"] == $selected_id)
				$resStr .= " selected";
			$resStr .= ">".$row["name"]."</option>\r\n";
		}

		return $resStr;
	}


	// Return Javascript array of currencies
	function getCurrencyArray()
	{
		global $db;

		$resStr = "";

		$resArr = $db->selectQ("id, name, sign", "currency", NULL, NULL, "id");
		$currcount = count($resArr);
		$resStr .= "var currency = [";
		foreach($resArr as $i => $row)
		{
			$resStr .= "[".$row["id"].", ".json_encode($row["name"]).", ".json_encode($row["sign"])."]".(($i < $currcount - 1) ? ", " : "];\r\n");
		}

		return $resStr;
	}


	// Return array of currency information of accounts
	function getAccCurrInfo($user_id)
	{
		global $db;

		$accCurr = array();

		$resArr = $db->selectQ("c.id AS curr_id, c.sign AS sign, a.id AS id, a.balance AS balance", "accounts AS a, currency AS c", "a.user_id=".$user_id." AND c.id=a.curr_id");
		foreach($resArr as $i => $row)
		{
			$accCurr[$i]["id"] = intval($row["id"]);
			$accCurr[$i]["curr_id"] = intval($row["curr_id"]);
			$accCurr[$i]["sign"] = $row["sign"];
		}

		return $accCurr;
	}


	// Return currency id of specified account from information array
	function getCurrId($accCurr, $account_id)
	{
		if (!count($accCurr) || !$account_id)
			return 0;

		foreach($accCurr as $ac)
		{
			if (intval($ac["id"]) == $account_id)
				return $ac["curr_id"];
		}

		return 0;
	}


	// Return currency sign of specified account from information array
	function getCurSign($accCurr, $account_id)
	{
		if (!count($accCurr) || !$account_id)
			return NULL;

		foreach($accCurr as $ac)
		{
			if (intval($ac["id"]) == $account_id)
				return $ac["sign"];
		}

		return NULL;
	}


	// Return currency sign by specified id
	function getSign($accCurr, $curr_id)
	{
		if (!count($accCurr) || !$curr_id)
			return NULL;

		foreach($accCurr as $ac)
		{
			if (intval($ac["curr_id"]) == $curr_id)
				return $ac["sign"];
		}

		return NULL;
	}
*/

?>