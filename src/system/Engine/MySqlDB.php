<?php

namespace JezveMoney\Core;

// Return quotted string or NULL
function qnull($str)
{
    return (is_null($str) ? "NULL" : "'$str'");
}


// Quotting join
function qjoin($glue, $pieces)
{
    if (!is_array($pieces)) {
        return "";
    }

    $quotted = [];
    foreach ($pieces as $item) {
        $quotted[] = qnull($item);
    }

    return implode($glue, $quotted);
}


// Prepare string for fields or tables list of query
function asJoin($pieces)
{
    $fstr = null;

    if (is_array($pieces)) {
        $parr = [];
        foreach ($pieces as $pkey => $pval) {
            if (is_string($pkey)) {
                $parr[] = "$pkey AS $pval";
            } else {
                $parr[] = $pval;
            }
        }
        $fstr = implode(", ", $parr);
    } elseif (is_string($pieces)) {
        $fstr = $pieces;
    }

    return $fstr;
}


// Prepare string of AND joined conditions for query
function andJoin($pieces)
{
    $fstr = null;

    if (is_array($pieces)) {
        $fstr = implode(" AND ", $pieces);
    } elseif (is_string($pieces)) {
        $fstr = $pieces;
    }

    return $fstr;
}


function brace($str)
{
    $len = strlen($str);
    if ($len > 1 && ($str[0] != "(" || $str[$len - 1] != ")")) {
        return "($str)";
    }

    return $str;
}


// Prepare string of OR joined conditions for query
function orJoin($pieces)
{
    $fstr = null;

    if (is_array($pieces)) {
        $fstr = "(" . implode(" OR ", array_map("JezveMoney\\Core\\brace", $pieces)) . ")";
    } elseif (is_string($pieces)) {
        $fstr = $pieces;
    }

    return $fstr;
}


function assignJoin($assignments)
{
    if (!is_array($assignments)) {
        $assignments = [$assignments];
    }

    $res = [];
    foreach ($assignments as $key => $value) {
        if (is_string($key)) {
            $res[] = $key . "=" . qnull($value);
        } elseif (is_numeric($key)) {
            $res[] = $value;
        } else {
            throw new \Error("Incorrect syntax");
        }
    }

    return implode(", ", $res);
}


function fieldsJoin($fields)
{
    $quotted = [];
    foreach ($fields as $field) {
        $quotted[] = "`$field`";
    }

    return "(" . implode(", ", $quotted) . ")";
}


function valuesJoin($values)
{
    return "(" . qjoin(", ", $values) . ")";
}


// Return right part of query condition to check field equal id or in set of ids
// Zero values are omitted. In case no valid values found NULL is returned
function inSetCondition($ids)
{
    if (is_null($ids)) {
        return null;
    }

    $validIds = skipZeros($ids);
    if (!is_array($validIds) || !count($validIds)) {
        return null;
    }

    if (count($validIds) == 1) {
        return "=" . $validIds[0];
    } else {
        return " IN (" . implode(",", $validIds) . ")";
    }
}


class MySqlDB
{
    use Singleton;

    private static $conn = null;        // connection
    private static $dbname = null;      // current database name
    private static $tblCache = null;    // cache of exist tables
    private static $config = null;      // saved connection settings

    protected $errno = 0;
    protected $errorMessage = null;
    protected $insert_id = 0;
    protected $affected = 0;


    public static function setup($config)
    {
        $reqFields = ["location", "user", "password", "name"];

        if (!is_null(self::$config)) {
            throw new \Error("DB already configured");
        }

        $config = checkFields($config, $reqFields);
        if (!$config) {
            throw new \Error("Invalid DB configuration");
        }

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
        if ($dbcnx) {
            self::$conn = $dbcnx;
        }

        if (is_null(self::$conn)) {
            wlog("Fail to connect");
        }

        return (self::$conn != null);
    }


    // Select database
    public function selectDB($name)
    {
        wlog("USE " . $name . ";");

        $res = mysqli_select_db(self::$conn, $name);
        if ($res) {
            self::$dbname = $name;
        }

        $this->errno = mysqli_errno(self::$conn);
        wlog("Result: " . ($this->errno ? ($this->errno . " - " . mysqli_error(self::$conn)) : "ok"));

        return $res;
    }


    // Check connection is already created
    private function checkConnection()
    {
        if (!is_null(self::$conn)) {
            return true;
        }

        if (!$this->connect()) {
            return false;
        }
        if (!$this->selectDB(self::$config["name"])) {
            return false;
        }
        $this->rawQ("SET NAMES 'utf8';");

        return true;
    }


    // Return escaped string
    public function escape($str)
    {
        if (!$this->checkConnection()) {
            return null;
        }

        return mysqli_real_escape_string(self::$conn, $str);
    }


    // Raw query to database
    public function rawQ($query)
    {
        if (!$this->checkConnection()) {
            return null;
        }

        $this->insert_id = null;
        $this->affected = null;

        wlog("Query: " . $query);

        $res = mysqli_query(self::$conn, $query);

        $this->errno = mysqli_errno(self::$conn);
        $this->errorMessage = mysqli_error(self::$conn);
        wlog("Result: " . ($this->errno ? ($this->errno . " - " . $this->errorMessage) : "ok"));

        return ($res !== false) ? $res : null;
    }


    // Select query
    public function selectQ($fields, $tables, $condition = null, $group = null, $order = null)
    {
        $fstr = asJoin($fields);
        $tstr = asJoin($tables);
        if (!$fstr || !$tstr) {
            return null;
        }

        $query = "SELECT $fstr FROM $tstr";
        if ($condition) {
            $query .= " WHERE " . andJoin($condition);
        }
        if ($group) {
            $query .= " GROUP BY $group";
        }
        if ($order) {
            $query .= " ORDER BY $order";
        }
        $query .= ";";

        $result = $this->rawQ($query);
        if ($result === false || $this->errno != 0) {
            return null;
        }

        return $result;
    }


    public function rowsCount($result)
    {
        if (is_null($result)) {
            return 0;
        }

        return mysqli_num_rows($result);
    }


    public function fetchRow($result)
    {
        if (is_null($result)) {
            return null;
        }

        return mysqli_fetch_array($result, MYSQLI_ASSOC);
    }


    // Insert query
    public function insertQ($table, $data)
    {
        $table = $this->escape($table);
        if (!$table || $table == "" || !is_array($data) || !count($data)) {
            return false;
        }

        $fields = [];
        $values = [];
        foreach ($data as $key => $value) {
            if (!is_string($key)) {
                continue;
            }

            $fields[] = $key;
            $values[] = $value;
        }

        $query = "INSERT INTO `$table` " . fieldsJoin($fields) . " VALUES " . valuesJoin($values) . ";";
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
    public function insertMultipleQ($table, $data, $isUpdate = false)
    {
        $table = $this->escape($table);
        if (!$table || $table == "" || !is_array($data) || !count($data)) {
            return false;
        }

        $data = array_values($data);
        if (!is_array($data[0])) {
            return false;
        }

        // Obtain fields from first data row
        $fields = [];
        foreach ($data[0] as $key => $val) {
            if (is_string($key)) {
                $fields[] = $key;
            }
        }
        if (!count($fields)) {
            return false;
        }

        $rowsValues = [];
        foreach ($data as $row) {
            if (!is_array($row)) {
                return false;
            }

            $values = checkFields($row, $fields);
            if (!is_array($values)) {
                return false;
            }

            $rowsValues[] = valuesJoin($values);
        }

        $query = "INSERT INTO `$table` " . fieldsJoin($fields) . " VALUES " . implode(",", $rowsValues);
        if ($isUpdate) {
            $query .= " ON DUPLICATE KEY UPDATE ";
            $valuesUpdate = [];
            foreach ($fields as $field) {
                if ($field == "id") {
                    continue;
                }

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
    public function updateQ($table, $data, $condition = null)
    {
        $table = $this->escape($table);
        if (!$table || $table == "" || empty($data)) {
            return false;
        }

        $query = "UPDATE `" . $table . "` SET " . assignJoin($data);
        if (!is_null($condition)) {
            $query .= " WHERE " . andJoin($condition);
        }
        $query .= ";";

        $this->rawQ($query);

        $this->affected = mysqli_affected_rows(self::$conn);

        return ($this->errno == 0);
    }


    public function updateMultipleQ($table, $data)
    {
        return $this->insertMultipleQ($table, $data, true);
    }


    // Truncate table query
    public function truncateQ($table)
    {
        $table = $this->escape($table);
        if (!$table || $table == "") {
            return false;
        }

        $query = "TRUNCATE TABLE `" . $table . "`;";
        $this->rawQ($query);

        $this->affected = mysqli_affected_rows(self::$conn);

        return ($this->errno == 0);
    }


    // Delete query
    public function deleteQ($table, $condition = null)
    {
        $table = $this->escape($table);
        if (!$table || $table == "") {
            return false;
        }

        if (is_null($condition)) {
            return $this->truncateQ($table);
        }

        $query = "DELETE FROM `" . $table . "` WHERE " . andJoin($condition) . ";";
        $this->rawQ($query);

        $this->affected = mysqli_affected_rows(self::$conn);

        return ($this->errno == 0);
    }


    // Return count of rows
    public function countQ($table, $condition = null)
    {
        $table = $this->escape($table);
        if (!$table || $table == "") {
            return false;
        }

        $res = 0;
        $query = "SELECT COUNT(*) AS cnt FROM " . $table;
        if (!is_null($condition)) {
            $query .= " WHERE " . andJoin($condition);
        }
        $query .= ";";

        $result = $this->rawQ($query);
        $rows = mysqli_num_rows($result);
        if (!$this->errno && $rows == 1) {
            $row = mysqli_fetch_array($result);
            if ($row) {
                $res = intval($row["cnt"]);
            }
        }

        return $res;
    }


    // Check table is exist
    public function isTableExist($table)
    {
        if (is_null(self::$tblCache)) {
            $query = "SHOW TABLES;";

            $result = $this->rawQ($query);
            $rows = mysqli_num_rows($result);

            self::$tblCache = [];
            if ($result && !$this->errno && $rows > 0) {
                while ($row = mysqli_fetch_array($result)) {
                    $tblName = $row[0];
                    self::$tblCache[$tblName] = true;
                }
            }
        }

        return (isset(self::$tblCache[$table]));
    }


    // Create table if not exist query
    public function createTableQ($table, $defs, $options)
    {
        $table = $this->escape($table);
        if (!$table || $table == "" || !$defs || $defs == "") {
            return false;
        }

        $query = "CREATE TABLE IF NOT EXISTS `$table` ($defs) $options;";

        $this->rawQ($query);
        if ($this->errno == 0) {
            self::$tblCache[$table] = true;
        }

        return ($this->errno == 0);
    }


    // Drop table if exist query
    public function dropTableQ($table)
    {
        $table = $this->escape($table);
        if (!$table || $table == "") {
            return false;
        }

        $query = "DROP TABLE IF EXISTS `" . $table . "`;";
        $this->rawQ($query);
        if ($this->errno == 0) {
            unset(self::$tblCache[$table]);
        }

        return ($this->errno == 0);
    }


    public function getColumns($table)
    {
        $table = $this->escape($table);
        if (!$table || $table == "") {
            return false;
        }

        $query = "SHOW COLUMNS FROM `" . $table . "`;";
        $result = $this->rawQ($query);
        $rows = mysqli_num_rows($result);

        $columns = [];
        if ($result && !$this->errno && $rows > 0) {
            while ($row = mysqli_fetch_array($result)) {
                $columnName = $row["Field"];
                $columns[$columnName] = [
                    "Type" => $row["Type"],
                    "Null" => $row["Null"],
                    "Key" => $row["Key"],
                    "Default" => $row["Default"],
                    "Extra" => $row["Extra"]
                ];
            }
        }

        return $columns;
    }


    // Add columns to specified table
    // $columns expected to be an array as follows:
    //  ["column_1" => "INT NOT NULL", "column_2" => "VARCHAR(255) NULL"]
    public function addColumns($table, $columns)
    {
        $table = $this->escape($table);
        if (!$table || $table == "") {
            return false;
        }
        if (!is_array($columns)) {
            return false;
        }

        $colDefs = [];
        foreach ($columns as $columnName => $columnDef) {
            if (!is_string($columnName)) {
                wlog("String key for column name is expected");
                return false;
            }
            $colDefs[] = $columnName . " " . $columnDef;
        }

        $query = "ALTER TABLE `" . $table . "` ADD COLUMN (" . implode(", ", $colDefs) . ");";
        $this->rawQ($query);

        return ($this->errno == 0);
    }


    // Rename column in specified table
    public function changeColumn($table, $oldName, $newName, $dataType)
    {
        $table = $this->escape($table);
        if (
            !$table || $table == ""
            || !$oldName || $oldName == ""
            || !$newName || $newName == ""
            || !$dataType || $dataType == ""
        ) {
            return false;
        }

        $query = "ALTER TABLE `" . $table . "` CHANGE COLUMN `" . $oldName . "` `" . $newName . "` " . $dataType . ";";
        $this->rawQ($query);

        return ($this->errno == 0);
    }


    // Remove specified columns from table
    public function dropColumns($table, $columns)
    {
        $table = $this->escape($table);
        if (!$table || $table == "") {
            return false;
        }
        if (is_null($columns) || $columns == "") {
            return false;
        }

        if (!is_array($columns)) {
            $columns = [$columns];
        }

        $dropOperations = [];
        foreach ($columns as $columnName) {
            if (!is_string($columnName) || $columnName == "") {
                return false;
            }

            $dropOperations[] = "DROP COLUMN `$columnName`";
        }

        $query = "ALTER TABLE `" . $table . "` " . implode(", ", $dropOperations) . ";";
        $this->rawQ($query);

        return ($this->errno == 0);
    }


    // Add keys(indexes) to specified table
    // $keys expected to be an associative array as follows:
    //  ["key_name_1" => "field_name", "key_name_2" => ["field_1", "field_2"]]
    public function addKeys($table, $keys)
    {
        $table = $this->escape($table);
        if (!$table || $table == "") {
            return false;
        }
        if (!is_array($keys)) {
            return false;
        }

        $keyDefs = [];
        foreach ($keys as $keyName => $keyDef) {
            if (!is_string($keyName)) {
                wlog("String key name is expected");
                return false;
            }
            $keyColumns = is_array($keyDef) ? $keyDef : [$keyDef];
            $keyDefs[] = $keyName . " (`" . implode("`, `", $keyColumns) . "`)";
        }

        $query = "ALTER TABLE `" . $table . "` ADD KEY " . implode(", ", $keyDefs) . ";";
        $this->rawQ($query);

        return ($this->errno == 0);
    }


    // Return current autoincrement value of specified table
    // Return FALSE in case of error
    public function getAutoIncrement($table)
    {
        if (!self::$dbname) {
            return false;
        }

        $table = $this->escape($table);
        if (!$table || $table == "") {
            return false;
        }

        $qResult = $this->selectQ(
            "AUTO_INCREMENT",
            "INFORMATION_SCHEMA.TABLES",
            [
                "TABLE_SCHEMA=" . qnull(self::$dbname),
                "TABLE_NAME=" . qnull($table)
            ]
        );
        $row = $this->fetchRow($qResult);
        if (!$row) {
            return false;
        }

        return intval($row["AUTO_INCREMENT"]);
    }
}
