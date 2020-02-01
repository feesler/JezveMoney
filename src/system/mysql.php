<?php

// Return quotted string or NULL
function qnull($str)
{
	return (is_null($str) ? "NULL" : "'".$str."'");
}


// Quotting join
function qjoin($glue, $pieces)
{
	$res = "";

	if (!is_array($pieces))
		return $res;

	for($i = 0; $i < count($pieces); $i++)
	{
		$res .= ($i ? $glue : "").qnull($pieces[$i]);
	}

	return $res;
}


// Prepare string for fields or tables list of query
function asJoin($pieces)
{
	$fstr = NULL;

	if (is_array($pieces))
	{
		$parr = [];
		foreach($pieces as $pkey => $pval)
		{
			if (is_string($pkey))
				$parr[] = $pkey." AS ".$pval;
			else
				$parr[] = $pval;
		}
		$fstr = implode(", ", $parr);
	}
	else if (is_string($pieces))
	{
		$fstr = $pieces;
	}

	return $fstr;
}


// Prepare string of AND joined conditions for query
function andJoin($pieces)
{
	$fstr = NULL;

	if (is_array($pieces))
	{
		$fstr = implode(" AND ", $pieces);
	}
	else if (is_string($pieces))
	{
		$fstr = $pieces;
	}

	return $fstr;
}


function brace($str)
{
	$len = strlen($str);
	if ($len > 1 &&	($str[0] != "(" || $str[ $len - 1 ] != ")"))
		return "( ".$str." )";

	return $str;
}


// Prepare string of OR joined conditions for query
function orJoin($pieces)
{
	$fstr = NULL;

	if (is_array($pieces))
	{
		$fstr = "(".implode(" OR ", array_map("brace", $pieces)).")";
	}
	else if (is_string($pieces))
	{
		$fstr = $pieces;
	}

	return $fstr;
}


function assignJoin($assignments)
{
	if (!is_array($assignments))
		$assignments = [ $assignments ];

	$res = [];
	foreach($assignments as $key => $value)
	{
		if (is_string($key))
		{
			$res[] = $key."=".qnull($value);
		}
		else if (is_numeric($key))
		{
			$res[] = $value;
		}
		else
			throw new Error("Incorrect syntax");
	}

	return implode(", ", $res);
}


// Return right part of query condition to check field equal id or in set of ids
// Zero values are omitted. In case no valid values found NULL is returned
function inSetCondition($ids)
{
	if (is_null($ids))
		return NULL;

	$validIds = skipZeros($ids);
	if (!count($validIds))
		return NULL;

	return (count($validIds) == 1) ? "=".$validIds[0] : " IN (".implode(",", $validIds).")";
}


class mysqlDB
{
	use Singleton;

	private static $conn = NULL;		// connection
	private static $dbname = NULL;		// current database name
	private static $tblCache = NULL;	// cache of exist tables
	private static $config = NULL;		// saved connection settings


	public static function setup($config)
	{
		$reqFields = ["location", "user", "password", "name"];

		if (!is_null(self::$config))
			throw new Error("DB already configured");

		$config = checkFields($config, $reqFields);
		if (!$config)
			throw new Error("Invalid DB configuration");

		self::$config = $config;
	}


	public function getConnection()
	{
		return self::$conn;
	}


	// Connect to database server
	protected function connect()
	{
		$dbcnx = mysqli_connect(self::$config["location"], self::$config["user"], self::$config["password"]);
		if ($dbcnx)
			self::$conn = $dbcnx;

		if (is_null(self::$conn))
			wlog("Fail to connect");

		return (self::$conn != NULL);
	}


	// Select database
	public function selectDB($name)
	{
		wlog("USE ".$name.";");

		$res = mysqli_select_db(self::$conn, $name);
		if ($res)
			self::$dbname = $name;

		$errno = mysqli_errno(self::$conn);
		wlog("Result: ".($errno ? ($errno." - ".mysqli_error(self::$conn)) : "ok"));

		return $res;
	}


	// Check connection is already created
	private function checkConnection()
	{
		if (!is_null(self::$conn))
			return TRUE;

		if (!$this->connect())
			return FALSE;
		if (!$this->selectDB(self::$config["name"]))
			return FALSE;
		$this->rawQ("SET NAMES 'utf8';");

		return TRUE;
	}


	// Return escaped string
	public function escape($str)
	{
		if (!$this->checkConnection())
			return NULL;

		return mysqli_real_escape_string(self::$conn, $str);
	}


	// Raw query to database
	public function rawQ($query)
	{
		if (!$this->checkConnection())
			return NULL;

		wlog("Query: ".$query);

		$res = mysqli_query(self::$conn, $query);

		$errno = mysqli_errno(self::$conn);
		wlog("Result: ".($errno ? ($errno." - ".mysqli_error(self::$conn)) : "ok"));

		return ($res !== FALSE) ? $res : NULL;
	}


	// Select query
	public function selectQ($fields, $tables, $condition = NULL, $group = NULL, $order = NULL)
	{
		$fstr = asJoin($fields);
		$tstr = asJoin($tables);
		if (!$fstr || !$tstr)
			return $resArr;

		$query = "SELECT ".$fstr." FROM ".$tstr;
		if ($condition)
			$query .= " WHERE ".andJoin($condition);
		if ($group)
			$query .= " GROUP BY ".$group;
		if ($order)
			$query .= " ORDER BY ".$order;
		$query .= ";";

		$result = $this->rawQ($query);
		if ($result === FALSE || mysqli_errno(self::$conn) != 0)
			return NULL;

		return $result;
	}


	public function rowsCount($result)
	{
		if (is_null($result))
			return 0;

		return mysqli_num_rows($result);
	}


	public function fetchRow($result)
	{
		if (is_null($result))
			return NULL;

		return mysqli_fetch_array($result, MYSQLI_ASSOC);
	}


	// Insert query
	public function insertQ($table, $data)
	{
		if (empty($table) || !is_array($data) || !count($data))
			return FALSE;

		$fields = [];
		$values = [];
		foreach($data as $key => $value)
		{
			if (!is_string($key))
				continue;

			$fields[] = "`".$key."`";
			$values[] = qnull($value);
		}

		$query = "INSERT INTO `".$table."` (".implode(", ", $fields).") VALUES (".implode(", ", $values).");";
		$this->rawQ($query);
		$errno = mysqli_errno(self::$conn);

		return ($errno == 0);
	}


	// Return last insert id
	public function insertId()
	{
		return mysqli_insert_id(self::$conn);
	}


	// Update query
	public function updateQ($table, $data, $condition = NULL)
	{
		if (empty($table) || empty($data))
			return FALSE;

		$query = "UPDATE `".$table."` SET ".assignJoin($data);
		if (!is_null($condition))
			$query .= " WHERE ".andJoin($condition);
		$query .= ";";

		$this->rawQ($query);
		$errno = mysqli_errno(self::$conn);

		return ($errno == 0);
	}


	// Truncate table query
	public function truncateQ($table)
	{
		if (!$table || $table == "")
			return FALSE;

		$query = "TRUNCATE TABLE `".$table."`;";
		$this->rawQ($query);
		return (mysqli_errno(self::$conn) == 0);
	}


	// Delete query
	public function deleteQ($table, $condition = NULL)
	{
		if (!$table || $table == "")
			return FALSE;

		if (is_null($condition))
			return $this->truncateQ($table);

		$query = "DELETE FROM `".$table."` WHERE ".andJoin($condition).";";
		$this->rawQ($query);

		return (mysqli_errno(self::$conn) == 0);
	}


	// Return count of rows
	public function countQ($table, $condition = NULL)
	{
		$res = 0;

		$query = "SELECT COUNT(*) AS cnt FROM ".$table;
		if (!is_null($condition))
			$query .= " WHERE ".andJoin($condition);
		$query .= ";";

		$result = $this->rawQ($query);
		$errno = mysqli_errno(self::$conn);
		$rows = mysqli_num_rows($result);
		if (!$errno && $rows == 1)
		{
			$row = mysqli_fetch_array($result);
			if ($row)
				$res = $row["cnt"];
		}

		return $res;
	}


	// Check table is exist
	public function isTableExist($table)
	{
		if (is_null(self::$tblCache))
		{
			$query = "SHOW TABLES;";

			$result = $this->rawQ($query);
			$errno = mysqli_errno(self::$conn);
			$rows = mysqli_num_rows($result);

			self::$tblCache = [];
			if ($result && !$errno && $rows > 0)
			{
				while($row = mysqli_fetch_array($result))
				{
					$tblName = $row[0];
					self::$tblCache[$tblName] = TRUE;
				}
			}
		}

		return (isset(self::$tblCache[$table]));
	}


	// Create table if not exist query
	public function createTableQ($table, $defs, $options)
	{
		if (!$table || $table == "" || !$defs || $defs == "")
			return FALSE;

		$query = "CREATE TABLE IF NOT EXISTS `".$table."` (".$defs.") ".$options.";";

		$this->rawQ($query);
		$errno = mysqli_errno(self::$conn);
		if ($errno == 0)
			self::$tblCache[$table] = TRUE;

		return ($errno == 0);
	}


	// Drop table if exist query
	public function dropTableQ($table)
	{
		if (!$table || $table == "")
			return FALSE;

		$query = "DROP TABLE IF EXISTS `".$table."`;";
		$this->rawQ($query);
		$errno = mysqli_errno(self::$conn);
		if ($errno == 0)
			unset(self::$tblCache[$table]);

		return ($errno == 0);
	}

}
