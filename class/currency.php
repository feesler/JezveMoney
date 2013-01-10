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

?>