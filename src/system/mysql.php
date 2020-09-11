<?php

// Return quotted string or NULL
function qnull($str)
{
	return (is_null($str) ? "NULL" : "'$str'");
}


// Quotting join
function qjoin($glue, $pieces)
{
	if (!is_array($pieces))
		return "";

	$quotted = [];
	foreach($pieces as $item)
	{
		$quotted[] = qnull($item);
	}

	return implode($glue, $quotted);
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
				$parr[] = "$pkey AS $pval";
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
		return "($str)";

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


function fieldsJoin($fields)
{
	$quotted = [];
	foreach($fields as $field)
	{
		$quotted[] = "`$field`";
	}

	return "(".implode(", ", $quotted).")";
}


function valuesJoin($values)
{
	return "(".qjoin(", ", $values).")";
}


// Return right part of query condition to check field equal id or in set of ids
// Zero values are omitted. In case no valid values found NULL is returned
function inSetCondition($ids)
{
	if (is_null($ids))
		return NULL;

	$validIds = skipZeros($ids);
	if (!is_array($validIds) || !count($validIds))
		return NULL;

	if (count($validIds) == 1)
		return "=".$validIds[0];
	else
		return " IN (".implode(",", $validIds).")";
}


class MySqlDB
{
	use Singleton;

	private static $conn = NULL;		// connection
	private static $dbname = NULL;		// current database name
	private static $tblCache = NULL;	// cache of exist tables
	private static $config = NULL;		// saved connection settings

	protected $errno = 0;
	protected $errorMessage = NULL;
	protected $insert_id = 0;
	protected $affected = 0;


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

		$this->errno = mysqli_errno(self::$conn);
		wlog("Result: ".($this->errno ? ($this->errno." - ".mysqli_error(self::$conn)) : "ok"));

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

		$this->insert_id = NULL;
		$this->affected = NULL;

		wlog("Query: ".$query);

		$res = mysqli_query(self::$conn, $query);

		$this->errno = mysqli_errno(self::$conn);
		$this->errorMessage = mysqli_error(self::$conn);
		wlog("Result: ".($this->errno ? ($this->errno." - ".$this->errorMessage) : "ok"));

		return ($res !== FALSE) ? $res : NULL;
	}


	// Select query
	public function selectQ($fields, $tables, $condition = NULL, $group = NULL, $order = NULL)
	{
		$fstr = asJoin($fields);
		$tstr = asJoin($tables);
		if (!$fstr || !$tstr)
			return NULL;

		$query = "SELECT $fstr FROM $tstr";
		if ($condition)
			$query .= " WHERE ".andJoin($condition);
		if ($group)
			$query .= " GROUP BY $group";
		if ($order)
			$query .= " ORDER BY $order";
		$query .= ";";

		$result = $this->rawQ($query);
		if ($result === FALSE || $this->errno != 0)
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
		if (!is_array($data) || !count($data))
			return FALSE;

		$fields = [];
		$values = [];
		foreach($data as $key => $value)
		{
			if (!is_string($key))
				continue;

			$fields[] = $key;
			$values[] = $value;
		}

		$query = "INSERT INTO `$table` ".fieldsJoin($fields)." VALUES ".valuesJoin($values).";";
		$this->rawQ($query);

		$this->insert_id = mysqli_insert_id(self::$conn);
		$this->affected = mysqli_affected_rows(self::$conn);

		return ($this->errno == 0);
	}


	// Return error number for last query
	public function getError()
	{
		return $this->errno;
	}


	// Return error number for last query
	public function getMessage()
	{
		return $this->errorMessage;
	}


	// Return last insert id
	public function insertId()
	{
		return $this->insert_id;
	}


	// Return last insert id
	public function affectedRows()
	{
		return $this->affected;
	}


	// Insert multiple rows query
	// $data should be array of row arrays, each same as for insertQ() method
	// Obtain fields from the first item of data array
	// Next other rows is compared match
	public function insertMultipleQ($table, $data, $isUpdate = FALSE)
	{
		if (empty($table) || !is_array($data) || !count($data))
			return FALSE;

		$data = array_values($data);
		if (!is_array($data[0]))
			return FALSE;

		// Obtain fields from first data row
		$fields = [];
		foreach($data[0] as $key => $val)
		{
			if (is_string($key))
				$fields[] = $key;
		}
		if (!count($fields))
			return FALSE;

		$rowsValues = [];
		foreach($data as $row)
		{
			if (!is_array($row))
				return FALSE;

			$values = checkFields($row, $fields);
			if (!is_array($values))
				return FALSE;

			$rowsValues[] = valuesJoin($values);
		}

		$query = "INSERT INTO `$table` ".fieldsJoin($fields)." VALUES ".implode(",", $rowsValues);
		if ($isUpdate)
		{
			$query .= " ON DUPLICATE KEY UPDATE ";
			$valuesUpdate = [];
			foreach($fields as $field)
			{
				if ($field == "id")
					continue;

				$valuesUpdate[] = "$field=VALUES($field)";
			}
			$query .= implode(",", $valuesUpdate);
		}
		$query .= ";";
		$this->rawQ($query);

		$this->insert_id = mysqli_insert_id(self::$conn);
		$this->affected = mysqli_affected_rows(self::$conn);

		return ($this->errno == 0);
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

		$this->affected = mysqli_affected_rows(self::$conn);

		return ($this->errno == 0);
	}


	public function updateMultipleQ($table, $data)
	{
		return $this->insertMultipleQ($table, $data, TRUE);
	}


	// Truncate table query
	public function truncateQ($table)
	{
		if (!$table || $table == "")
			return FALSE;

		$query = "TRUNCATE TABLE `".$table."`;";
		$this->rawQ($query);

		$this->affected = mysqli_affected_rows(self::$conn);

		return ($this->errno == 0);
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

		$this->affected = mysqli_affected_rows(self::$conn);

		return ($this->errno == 0);
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
		$rows = mysqli_num_rows($result);
		if (!$this->errno && $rows == 1)
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
			$rows = mysqli_num_rows($result);

			self::$tblCache = [];
			if ($result && !$this->errno && $rows > 0)
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

		$query = "CREATE TABLE IF NOT EXISTS `$table` ($defs) $options;";

		$this->rawQ($query);
		if ($this->errno == 0)
			self::$tblCache[$table] = TRUE;

		return ($this->errno == 0);
	}


	// Drop table if exist query
	public function dropTableQ($table)
	{
		if (!$table || $table == "")
			return FALSE;

		$query = "DROP TABLE IF EXISTS `".$table."`;";
		$this->rawQ($query);
		if ($this->errno == 0)
			unset(self::$tblCache[$table]);

		return ($this->errno == 0);
	}


	// Add columns to specified table
	public function addColumns($table, $columns)
	{
		if (!$table || $table == "")
			return FALSE;
		if (!is_array($columns))
			return FALSE;

		$colDefs = [];
		foreach($columns as $columnName => $columnDef)
		{
			$colDefs[] = $columnName." ".$columnDef;
		}

		$query = "ALTER TABLE `".$table."` ADD COLUMN (".implode(", ", $colDefs).");";
		$this->rawQ($query);

		return ($this->errno == 0);	
	}


	// Rename column in specified table
	public function changeColumn($table, $oldName, $newName, $dataType)
	{
		if (!$table || $table == "" ||
			!$oldName || $oldName == "" ||
			!$newName || $newName == "" ||
			!$dataType || $dataType == "")
			return FALSE;

		$query = "ALTER TABLE `".$table."` CHANGE COLUMN `".$oldName."` `".$newName."` ".$dataType.";";
		$this->rawQ($query);

		return ($this->errno == 0);	
	}


	// Return current autoincrement value of specified table
	// Return FALSE in case of error
	public function getAutoIncrement($table)
	{
		if (!self::$dbname)
			return FALSE;

		$table = $this->escape($table);
		if (!$table || $table == "")
			return FALSE;

		$qResult = $this->selectQ("AUTO_INCREMENT", "INFORMATION_SCHEMA.TABLES",
									[ "TABLE_SCHEMA=".qnull(self::$dbname),
										"TABLE_NAME=".qnull($table)]);
		$row = $this->fetchRow($qResult);
		if (!$row)
			return FALSE;

		return intval($row["AUTO_INCREMENT"]);
	}
}
