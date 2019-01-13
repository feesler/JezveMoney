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
		$parr = array();
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


// Prepare string of OR joined conditions for query
function orJoin($pieces)
{
	$fstr = NULL;

	if (is_array($pieces))
	{
		$fstr = implode(" OR ", $pieces);
	}
	else if (is_string($pieces))
	{
		$fstr = $pieces;
	}

	return $fstr;
}



class mysqlDB
{
	private static $conn = NULL;		// connection
	private static $dbname = NULL;		// current database name
	private static $tblCache = NULL;	// cache of exist tables


	// Constructor
	public function __construct()
	{
		wlog("");
	}


	public function getConnection()
	{
		return self::$conn;
	}


	// Connect to database server
	public function connect($dblocation, $dbuser, $dbpasswd)
	{
		$dbcnx = @mysqli_connect($dblocation, $dbuser, $dbpasswd);
		if ($dbcnx)
			self::$conn = $dbcnx;

		return (self::$conn != NULL);
	}


	// Select database
	public function selectDB($name)
	{
		wlog("USE ".$name.";");

		$res = @mysqli_select_db(self::$conn, $name);
		if ($res)
			self::$dbname = $name;

		$errno = mysqli_errno(self::$conn);
		wlog("Result: ".($errno ? ($errno." - ".mysql_error(self::$conn)) : "ok"));

		return $res;
	}


	// Return escaped string
	public function escape($str)
	{
		return mysqli_real_escape_string(self::$conn, $str);
	}


	// Raw query to database
	public function rawQ($query)
	{
		wlog("Query: ".$query);

		$res = mysqli_query(self::$conn, $query);

		$errno = mysqli_errno(self::$conn);
		wlog("Result: ".($errno ? ($errno." - ".mysqli_error(self::$conn)) : "ok"));

		return ($res != FALSE) ? $res : NULL;
	}


	// Select query
	public function selectQ($fields, $tables, $condition = NULL, $group = NULL, $order = NULL)
	{
		$resArr = array();

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
		if ($result && !mysqli_errno(self::$conn) && mysqli_num_rows($result) > 0)
		{
			while($row = mysqli_fetch_array($result))
			{
				$resArr[] = $row;
			}
		}

		return $resArr;
	}


	// Insert query
	public function insertQ($table, $fields, $values)
	{
		if (!$table || $table == "" || !$fields || $fields == "" || !$values || $values == "")
			return FALSE;

		$query = "INSERT INTO `".$table."` (`".join("`, `", $fields)."`) VALUES (".qjoin(", ", $values).");";
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
	public function updateQ($table, $fields, $values, $condition = NULL)
	{
		if (!$table || $table == "" || !$fields || $fields == "" || !$values || $values == "")
			return FALSE;

		$fcount = count($fields);
		$vcount = count($values);

		if ($fcount != $vcount)
			return FALSE;

		$query = "UPDATE `".$table."` SET ";

		for($i = 0; $i < $fcount; $i++)
		{
			$query .= $fields[$i]." = ".qnull($values[$i]);
			if ($i < $fcount - 1)
				$query .= ", ";
		}

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

		$query = "SELECT COUNT(*) FROM ".$table;
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
				$res = $row["COUNT(*)"];
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

			self::$tblCache = array();
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
