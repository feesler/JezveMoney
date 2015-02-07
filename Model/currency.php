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


	// Clean cached data. Next getCache() request will update cache
	protected static function cleanCache()
	{
		self::$cache = NULL;
	}


	// Return count of currencies
	public static function getCount()
	{
		if (!self::checkCache())
			return 0;

		return count(self::$cache);
	}


	// Check is specified currency is exist
	public function is_exist($curr_id)
	{
		if (!is_numeric($curr_id))
			return FALSE;

		$curr_id = intval($curr_id);
		if (!$curr_id)
			return FALSE;

		if (!self::checkCache())
			return FALSE;

		return isset(self::$cache[$curr_id]);
	}


	// Create new currency and return id if successfully
	public static function create($curr_name, $curr_sign, $curr_format)
	{
		global $db;

		$curr_name = $db->escape($curr_name);
		$curr_sign = $db->escape($curr_sign);
		$curr_format = intval($curr_format);

		if (!$curr_name || $curr_name == "" || !$curr_sign || $curr_sign == "")
			return 0;

		if (!$db->insertQ("currency", array("id", "name", "sign", "format"),
							array(NULL, $curr_name, $curr_sign, $curr_format)))
			return 0;

		self::cleanCache();

		return $db->insertId();
	}


	// Edit specified currency
	public static function edit($curr_id, $curr_name, $curr_sign, $curr_format)
	{
		global $db;

		$curr_id = intval($curr_id);
		$curr_name = $db->escape($curr_name);
		$curr_sign = $db->escape($curr_sign);
		$curr_format = intval($curr_format);

		if (!$curr_id || !$curr_name || $curr_name == "" || !$curr_sign || $curr_sign == "")
			return FALSE;

		if (!self::is_exist($curr_id))
			return FALSE;

		if (!$db->updateQ("currency", array("name", "sign", "format"),
								array($curr_name, $curr_sign, $curr_format),
								"id=".$curr_id))
			return FALSE;

		self::cleanCache();

		return TRUE;
	}


	// Check currency is in use
	public static function isInUse($curr_id)
	{
		global $db;

		$curr_id = intval($curr_id);
		if (!$curr_id)
			return FALSE;

		$resArr = $db->selectQ("id", "account", "curr_id=".$curr_id);
		if (count($resArr) > 0)
			return TRUE;

		$resArr = $db->selectQ("id", "transactions", "curr_id=".$curr_id);
		if (count($resArr) > 0)
			return TRUE;

		return FALSE;
	}


	// Delete specified currency
	public static function del($curr_id)
	{
		global $db;

		$curr_id = intval($curr_id);
		if (!$curr_id)
			return FALSE;

		// don't delete currencies in use
		if (self::isInUse($curr_id))
			return FALSE;

		if (!$db->deleteQ("currency", "id=".$curr_id))
			return FALSE;

		self::cleanCache();

		return TRUE;
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
		$sign = self::getSign($curr_id);

		$sfmt = (($fmt) ? ($sign." %s") : ("%s ".$sign));
		return valFormat($sfmt, $value);
	}


	// Return id of account by specified position
	public static function getIdByPos($position)
	{
		if (!self::checkCache())
			return 0;

		$keys = array_keys(self::$cache);
		if (isset($keys[$position]))
			return $keys[$position];

		return 0;
	}


	// Return array of currencies
	public static function getArray()
	{
		$res = array();

		if (!self::checkCache())
			return $res;

		foreach(self::$cache as $curr_id => $row)
		{
			$currObj = new apiObject;

			$currObj->id = $curr_id;
			$currObj->name = $row["name"];
			$currObj->sign = $row["sign"];
			$currObj->format = intval($row["format"]);

			$res[] = $currObj;
		}

		return $res;
	}
}
