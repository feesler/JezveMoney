<?php

class CurrencyModel extends CachedTable
{
	static private $dcache = NULL;


	// Class constructor
	public function __construct()
	{
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
		self::$dcache = array();

		$resArr = $this->dbObj->selectQ("*", "currency");
		foreach($resArr as $row)
		{
			$curr_id = $row["id"];

			self::$dcache[$curr_id]["name"] = $row["name"];
			self::$dcache[$curr_id]["sign"] = $row["sign"];
			self::$dcache[$curr_id]["format"] = $row["format"];
			self::$dcache[$curr_id]["createdate"] = strtotime($row["createdate"]);
			self::$dcache[$curr_id]["updatedate"] = strtotime($row["updatedate"]);
		}
	}


	// Create new currency and return id if successfully
	public function create($curr_name, $curr_sign, $curr_format)
	{
		$curr_name = $this->dbObj->escape($curr_name);
		$curr_sign = $this->dbObj->escape($curr_sign);
		$curr_format = intval($curr_format);

		if (!$curr_name || $curr_name == "" || !$curr_sign || $curr_sign == "")
			return 0;

		$curDate = date("Y-m-d H:i:s");

		if (!$this->dbObj->insertQ("currency", array("id", "name", "sign", "format", "createdate", "updatedate"),
							array(NULL, $curr_name, $curr_sign, $curr_format, $curDate, $curDate)))
			return 0;

		$this->cleanCache();

		return $this->dbObj->insertId();
	}


	// Edit specified currency
	public function edit($curr_id, $curr_name, $curr_sign, $curr_format)
	{
		$curr_id = intval($curr_id);
		$curr_name = $this->dbObj->escape($curr_name);
		$curr_sign = $this->dbObj->escape($curr_sign);
		$curr_format = intval($curr_format);

		if (!$curr_id || !$curr_name || $curr_name == "" || !$curr_sign || $curr_sign == "")
			return FALSE;

		if (!$this->is_exist($curr_id))
			return FALSE;

		$curDate = date("Y-m-d H:i:s");

		if (!$this->dbObj->updateQ("currency", array("name", "sign", "format", "updatedate"),
								array($curr_name, $curr_sign, $curr_format, $curDate),
								"id=".$curr_id))
			return FALSE;

		$this->cleanCache();

		return TRUE;
	}


	// Check currency is in use
	public function isInUse($curr_id)
	{
		$curr_id = intval($curr_id);
		if (!$curr_id)
			return FALSE;

		$resArr = $this->dbObj->selectQ("id", "account", "curr_id=".$curr_id);
		if (count($resArr) > 0)
			return TRUE;

		$resArr = $this->dbObj->selectQ("id", "transactions", "curr_id=".$curr_id);
		if (count($resArr) > 0)
			return TRUE;

		return FALSE;
	}


	// Delete specified currency
	public function del($curr_id)
	{
		$curr_id = intval($curr_id);
		if (!$curr_id)
			return FALSE;

		// don't delete currencies in use
		if ($this->isInUse($curr_id))
			return FALSE;

		if (!$this->dbObj->deleteQ("currency", "id=".$curr_id))
			return FALSE;

		$this->cleanCache();

		return TRUE;
	}


	// Return name of specified currency
	public function getName($curr_id)
	{
		return $this->getCache($curr_id, "name");
	}


	// Return sign of specified currency
	public function getSign($curr_id)
	{
		return $this->getCache($curr_id, "sign");
	}


	// Return format of specified currency
	public function getFormat($curr_id)
	{
		return $this->getCache($curr_id, "format");
	}


	// Format value in specified currency
	public function format($value, $curr_id)
	{
		$fmt = $this->getFormat($curr_id);
		$sign = $this->getSign($curr_id);

		$sfmt = (($fmt) ? ($sign." %s") : ("%s ".$sign));
		return valFormat($sfmt, $value);
	}


	// Return id of account by specified position
	public function getIdByPos($position)
	{
		if (!$this->checkCache())
			return 0;

		$keys = array_keys(self::$dcache);
		if (isset($keys[$position]))
			return $keys[$position];

		return 0;
	}


	// Return array of currencies
	public function getArray()
	{
		$res = array();

		if (!$this->checkCache())
			return $res;

		foreach(self::$dcache as $curr_id => $row)
		{
			$currObj = new stdClass;

			$currObj->id = $curr_id;
			$currObj->name = $row["name"];
			$currObj->sign = $row["sign"];
			$currObj->format = intval($row["format"]);

			$res[] = $currObj;
		}

		return $res;
	}
}
