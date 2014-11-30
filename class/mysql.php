﻿<?php

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


// Join array of condition with AND operator
function andJoin($condition)
{
	if (is_array($condition))
		return implode(" AND ", $condition);
	else if (is_string($condition))
		return $condition;

	return NULL;
}


// Join array of condition with OR operator
function orJoin($condition)
{
	if (is_array($condition))
		return implode(" OR ", $condition);
	else if (is_string($condition))
		return $condition;

	return NULL;
}


class mysqlDB
{
	private $conn;			// connection
	private $dbname;		// current database name


	// Constructor
	public function __construct()
	{
		$this->conn = NULL;
		$this->dbname = NULL;

		wlog("");
	}


	// Connect to database server
	public function connect($dblocation, $dbuser, $dbpasswd)
	{
		$dbcnx = mysql_connect($dblocation, $dbuser, $dbpasswd);
		if ($dbcnx)
			$this->conn = $dbcnx;

		return ($this->conn != NULL);
	}


	// Select database
	public function selectDB($name)
	{
		$res = mysql_select_db($name, $this->conn);
		if ($res)
			$this->dbname = $name;

		return $res;
	}


	// Return escaped string
	public function escape($str)
	{
		return mysql_real_escape_string($str);
	}


	// Raw query to database
	public function rawQ($query)
	{
		wlog("Query: ".$query);

		$res = mysql_query($query, $this->conn);

		$errno = mysql_errno();
		wlog("Result: ".($errno ? ($errno." - ".mysql_error()) : "ok"));

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
			$query .= " WHERE ".$condition;
		if ($group)
			$query .= " GROUP BY ".$group;
		if ($order)
			$query .= " ORDER BY ".$order;
		$query .= ";";

		$result = $this->rawQ($query);
		if ($result && !mysql_errno() && mysql_num_rows($result) > 0)
		{
			$i = 0;
			while($row = mysql_fetch_array($result))
			{
				$resArr[$i] = $row;
				$i++;
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
		$errno = mysql_errno();

		return ($errno == 0);
	}


	// Return last insert id
	public function insertId()
	{
		return mysql_insert_id();
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

		if ($condition)
			$query .= " WHERE ".$condition;
		$query .= ";";

		$this->rawQ($query);
		$errno = mysql_errno();

		return ($errno == 0);
	}


	// Truncate table query
	public function truncateQ($table)
	{
		if (!$table || $table == "")
			return FALSE;

		$query = "TRUNCATE TABLE `".$table."`;";
		$this->rawQ($query);
		return (mysql_errno() == 0);
	}


	// Delete query
	public function deleteQ($table, $condition = NULL)
	{
		if (!$table || $table == "")
			return FALSE;

		if (!$condition)
			return $this->truncateQ($table);

		$query = "DELETE FROM `".$table."` WHERE ".$condition.";";
		$this->rawQ($query);

		return (mysql_errno() == 0);
	}


	// Return count of rows
	public function countQ($table, $condition = NULL)
	{
		$res = 0;

		$query = "SELECT COUNT(*) FROM ".$table;
		if ($condition)
			$query .= " WHERE ".$condition;
		$query .= ";";

		$result = 	$this->rawQ($query);
		$errno = mysql_errno();
		$rows = mysql_num_rows($result);
		if (!$errno && $rows == 1)
		{
			$row = mysql_fetch_array($result);
			if ($row)
				$res = $row["COUNT(*)"];
		}

		return $res;
	}
	
	
	// Create table if not exist query
	public function createTableQ($table, $defs, $options)
	{
		if (!$table || $table == "" || !$defs || $defs == "")
			return FALSE;

		$query = "CREATE TABLE IF NOT EXISTS `".$table."` (".$defs.") ".$options.";";

		$this->rawQ($query);

		return (mysql_errno() == 0);
	}


	// Drop table if exist query
	public function dropTableQ($table)
	{
		if (!$table || $table == "")
			return FALSE;

		$query = "DROP TABLE IF EXISTS `".$table."`;";
		$this->rawQ($query);

		return (mysql_errno() == 0);
	}

}
