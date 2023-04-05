<?php

namespace JezveMoney\Core;

/**
 * Return quotted string or NULL
 *
 * @param mixed $str
 *
 * @return string
 */
function qnull(mixed $str)
{
    return (is_null($str) ? "NULL" : "'$str'");
}

/**
 * Returns array of quotted values joined with specified separator
 *
 * @param string $glue separator
 * @param array $pieces array of values
 *
 * @return string
 */
function qjoin(string $glue, array $pieces)
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

/**
 * Returns string of joined 'key' as 'value' entries of specified array
 * Result is used as fields and tables requests
 *
 * @param string|array|null $pieces
 *
 * @return string|null
 */
function asJoin(mixed $pieces)
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

/**
 * Returns string of 'AND' joined conditions
 *
 * @param string|array|null $pieces
 *
 * @return string|null
 */
function andJoin(mixed $pieces)
{
    $fstr = null;

    if (is_array($pieces)) {
        $fstr = implode(" AND ", $pieces);
    } elseif (is_string($pieces)) {
        $fstr = $pieces;
    }

    return $fstr;
}

/**
 * Returns specified string enclosed in parentheses
 * Returns unchanged string if it is already parenthesized
 *
 * @param string $str
 *
 * @return string
 */
function brace(string $str)
{
    $len = strlen($str);
    if ($len > 1 && ($str[0] != "(" || $str[$len - 1] != ")")) {
        return "($str)";
    }

    return $str;
}

/**
 * Returns string of 'OR' joined conditions
 *
 * @param string|array|null $pieces
 *
 * @return string|null
 */
function orJoin(mixed $pieces)
{
    $fstr = null;

    if (is_array($pieces)) {
        $fstr = "(" . implode(" OR ", array_map("JezveMoney\\Core\\brace", $pieces)) . ")";
    } elseif (is_string($pieces)) {
        $fstr = $pieces;
    }

    return $fstr;
}

/**
 * Returns string of joined 'key' = 'value' entries of specified array
 * Result is used as expressions for UPDATE query
 *
 * @param string|array|null $assignments
 *
 * @return string
 */
function assignJoin(mixed $assignments)
{
    if (!is_array($assignments)) {
        $assignments = [$assignments];
    }

    $res = [];
    foreach ($assignments as $key => $value) {
        if (is_string($key)) {
            $res[] = "`" . $key . "`=" . qnull($value);
        } elseif (is_numeric($key)) {
            $res[] = $value;
        } else {
            throw new \Error("Incorrect syntax");
        }
    }

    return implode(", ", $res);
}

/**
 * Returns string of joined quotted values of specified array
 * Result is used as fields list for INSERT query
 *
 * @param array $fields
 *
 * @return string
 */
function fieldsJoin(array $fields)
{
    $quotted = [];
    foreach ($fields as $field) {
        $quotted[] = "`$field`";
    }

    return "(" . implode(", ", $quotted) . ")";
}

/**
 * Returns string of joined quotted values of specified array
 * Result is used as values list for INSERT query
 *
 * @param array $values
 *
 * @return string
 */
function valuesJoin(array $values)
{
    return "(" . qjoin(", ", $values) . ")";
}

/**
 * Returns right part of query condition to check field equal id or in set of ids
 * Zero values are omitted. In case no valid values found NULL is returned
 *
 * @param int|int[]|null $ids
 * @param bool $skipZero
 *
 * @return string|null
 */
function inSetCondition(mixed $ids, bool $skipZero = true)
{
    if (is_null($ids)) {
        return null;
    }

    $validIds = ($skipZero) ? skipZeros($ids) : $ids;
    if (!is_array($validIds) || !count($validIds)) {
        return null;
    }

    if (count($validIds) == 1) {
        return "=" . $validIds[0];
    } else {
        return " IN (" . implode(",", $validIds) . ")";
    }
}

/**
 * MySQL database class
 */
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

    /**
     * Sets up database configuration
     *
     * @param array $config
     */
    public static function setup(array $config)
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

    /**
     * Returns database connection
     *
     * @return \mysqli
     */
    public function getConnection()
    {
        return self::$conn;
    }

    /**
     * Connects to database server
     *
     * @return bool
     */
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

    /**
     * Selects database
     *
     * @param string $name database name
     *
     * @return bool
     */
    public function selectDB(string $name)
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

    /**
     * Checks connection is already created
     *
     * @return bool
     */
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
        $this->rawQ("SET NAMES 'utf8mb4';");
        $this->rawQ("SET autocommit=0;");

        return true;
    }

    /**
     * Returns escaped string
     *
     * @param string $str
     *
     * @return string|null
     */
    public function escape(string $str)
    {
        if (!$this->checkConnection()) {
            return null;
        }

        return mysqli_real_escape_string(self::$conn, $str);
    }

    /**
     * Executes raw query on database and returns result
     *
     * @param string $query
     *
     * @return \mysqli_result|null
     */
    public function rawQ(string $query)
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

    /**
     * Starts transaction
     *
     * @return bool
     */
    public function startTransaction()
    {
        $this->rawQ("START TRANSACTION;");
        return ($this->errno == 0);
    }

    /**
     * Commits transaction
     *
     * @return bool
     */
    public function commitTransaction()
    {
        $this->rawQ("COMMIT;");
        return ($this->errno == 0);
    }

    /**
     * Rolls back transaction
     *
     * @return bool
     */
    public function rollbackTransaction()
    {
        $this->rawQ("ROLLBACK;");
        return ($this->errno == 0);
    }


    // Select query
    /**
     * Executes SELECT query and returns result
     *
     * @param string|array|null $fields
     * @param string|array|null $tables
     * @param mixed|null $condition
     * @param string|null $group
     * @param string|null $order
     *
     * @return \mysqli_result|null
     */
    public function selectQ(
        mixed $fields,
        mixed $tables,
        mixed $condition = null,
        ?string $group = null,
        ?string $order = null
    ) {
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

    /**
     * Returns rows count of SELECT query result
     *
     * @param \mysqli_result|null $result
     *
     * @return int
     */
    public function rowsCount(?\mysqli_result $result)
    {
        if (is_null($result)) {
            return 0;
        }

        return mysqli_num_rows($result);
    }

    /**
     * Fetches next row from SELECT query result
     *
     * @param \mysqli_result|null $result
     *
     * @return mixed
     */
    public function fetchRow(?\mysqli_result $result)
    {
        if (is_null($result)) {
            return null;
        }

        return mysqli_fetch_array($result, MYSQLI_ASSOC);
    }

    /**
     * Executes INSERT query and returns result
     *
     * @param string $table table name
     * @param array $data
     *
     * @return bool
     */
    public function insertQ(string $table, array $data)
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

    /**
     * Returns error number for last query
     *
     * @return int
     */
    public function getError()
    {
        return $this->errno;
    }

    /**
     * Returns error message for last query
     *
     * @return string
     */
    public function getMessage()
    {
        return $this->errorMessage;
    }

    /**
     * Returns last insert id
     *
     * @return int
     */
    public function insertId()
    {
        return $this->insert_id;
    }

    /**
     * Returns count of affected rows
     *
     * @return int
     */
    public function affectedRows()
    {
        return $this->affected;
    }

    /**
     * Executes INSERT query for multiple rows
     *
     * @param string $table
     * @param array $data array of row arrays, each same as for insertQ() method
     * @param bool $isUpdate
     *
     * @return bool
     */
    public function insertMultipleQ(string $table, array $data, bool $isUpdate = false)
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

                $valuesUpdate[] = "`$field`=VALUES(`$field`)";
            }
            $query .= implode(",", $valuesUpdate);
        }
        $query .= ";";
        $this->rawQ($query);

        $this->insert_id = mysqli_insert_id(self::$conn);
        $this->affected = mysqli_affected_rows(self::$conn);

        return ($this->errno == 0);
    }

    /**
     * Executes UPDATE query and returns result
     *
     * @param string $table table name
     * @param array $data array of update expressions
     * @param mixed|null $condition update condition
     *
     * @return bool
     */
    public function updateQ(string $table, array $data, mixed $condition = null)
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

    /**
     * Updates multiple items
     *
     * @param string $table table name
     * @param array $data
     *
     * @return bool
     */
    public function updateMultipleQ(string $table, array $data)
    {
        return $this->insertMultipleQ($table, $data, true);
    }

    /**
     * Executes TRUNCATE TABLE query
     *
     * @param string $table table name
     *
     * @return bool
     */
    public function truncateQ(string $table)
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

    /**
     * Executes DELETE query on table
     *
     * @param string $table table name
     * @param mixed|null $condition delete conditions
     *
     * @return bool
     */
    public function deleteQ(string $table, mixed $condition = null)
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

    /**
     * Returns count of rows for specified condition
     *
     * @param string $table table name
     * @param mixed|null $condition
     *
     * @return int|bool
     */
    public function countQ(string $table, mixed $condition = null)
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

    /**
     * Returns true if specified table is exists
     *
     * @param string $table
     *
     * @return bool
     */
    public function isTableExist(string $table)
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

    /**
     * Executes CREATE TABLE query
     *
     * @param string $table table name
     * @param string $defs columns
     * @param string $options
     *
     * @return bool
     */
    public function createTableQ(string $table, string $defs, string $options)
    {
        $table = $this->escape($table);
        $defs = $this->escape($defs);
        $options = $this->escape($options);
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

    /**
     * Executes DROP TABLE query
     *
     * @param string $table table name
     *
     * @return bool
     */
    public function dropTableQ(string $table)
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

    /**
     * Returns array of table columns
     *
     * @param string $table table name
     *
     * @return array|bool
     */
    public function getColumns(string $table)
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

    /**
     * Add columns to specified table
     *
     * @param string $table table name
     * @param array $columns array of columns as following: ["column_1" => "INT NOT NULL", ...]
     *
     * @return bool
     */
    public function addColumns(string $table, array $columns)
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
            $colDefs[] = "`" . $columnName . "` " . $columnDef;
        }

        $query = "ALTER TABLE `" . $table . "` ADD COLUMN (" . implode(", ", $colDefs) . ");";
        $this->rawQ($query);

        return ($this->errno == 0);
    }

    /**
     * Renames column in specified table
     *
     * @param string $table table name
     * @param string $oldName current name of column
     * @param string $newName new name of column
     * @param string $dataType column data type
     *
     * @return bool
     */
    public function changeColumn(string $table, string $oldName, string $newName, string $dataType)
    {
        $table = $this->escape($table);
        $oldName = $this->escape($oldName);
        $newName = $this->escape($newName);
        $dataType = $this->escape($dataType);
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

    /**
     * Removes specified columns from table
     *
     * @param string $table table name
     * @param string|string[]|null $columns
     *
     * @return bool
     */
    public function dropColumns(string $table, mixed $columns)
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

    /**
     * Add keys(indexes) to specified table
     *
     * @param string $table table name
     * @param array $keys array of keys as following:
     *              ["key_1" => "field_name", "key_2" => ["field_1", "field_2"], ...]
     *
     * @return bool
     */
    public function addKeys(string $table, array $keys)
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

    /**
     * Returns current autoincrement value of specified table
     * Return false in case of error
     *
     * @param string $table table name
     *
     * @return int|bool
     */
    public function getAutoIncrement(string $table)
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

    /**
     * Changes table engine
     *
     * @param string $table table name
     * @param string $engine table engine
     *
     * @return bool
     */
    public function setTableEngine(string $table, string $engine)
    {
        $table = $this->escape($table);
        $engine = $this->escape($engine);
        if (!$table || $table == "" || !$engine || $engine == "") {
            return false;
        }

        $query = "ALTER TABLE `" . $table . "` ENGINE = " . qnull($engine) . ";";
        $this->rawQ($query);

        return ($this->errno == 0);
    }

    /**
     * Changes table charset
     *
     * @param string $table table name
     * @param string $charset table charset
     *
     * @return bool
     */
    public function convertTableCharset(string $table, string $charset)
    {
        $table = $this->escape($table);
        $charset = $this->escape($charset);
        if (!$table || $table == "" || !$charset || $charset == "") {
            return false;
        }

        $query = "ALTER TABLE `" . $table . "` CONVERT TO CHARACTER SET " . qnull($charset) . ";";
        $this->rawQ($query);

        return ($this->errno == 0);
    }
}
