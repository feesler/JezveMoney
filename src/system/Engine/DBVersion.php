<?php

namespace JezveMoney\Core;

use JezveMoney\App\Model\IconModel;

use const JezveMoney\App\Model\CURRENCY_FORMAT_TRAILING_ZEROS;
use const JezveMoney\App\Model\MAX_PRECISION;

const TABLE_OPTIONS = "ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci";

const DECIMAL_TYPE = "DECIMAL(25," . MAX_PRECISION . ")";

/**
 * Database version manager class
 */
class DBVersion
{
    use Singleton;

    protected $tbl_name = "dbver";
    protected $latestVersion = 21;
    protected $dbClient = null;
    protected $tables = [
        "accounts",
        "admin_query",
        "currency",
        "dbver",
        "icon",
        "import_act",
        "import_cond",
        "import_rule",
        "import_tpl",
        "persons",
        "transactions",
        "categories",
        "user_settings",
        "user_currency",
        "users",
    ];

    /**
     * Initialization
     */
    protected function onStart()
    {
        $this->dbClient = MySqlDB::getInstance();

        if (!$this->dbClient->isTableExist($this->tbl_name)) {
            $this->install();
        }
    }

    /**
     * Creates all tables
     */
    private function install()
    {
        try {
            Model::begin();

            $this->createCurrencyTable();
            $this->createAccountsTable();
            $this->createPersonsTable();
            $this->createTransactionsTable();
            $this->createCategoriesTable();
            $this->createUsersTable();
            $this->createUserSettingsTable();
            $this->createUserCurrencyTable();
            $this->createIconTable();
            $this->createImportTemplateTable();
            $this->createImportRuleTable();
            $this->createImportConditionTable();
            $this->createImportActionTable();
            $this->createAdminQueryTable();

            $this->createDBVersionTable();
            $this->setVersion($this->latestVersion);

            Model::commit();
        } catch (\Error $e) {
            wlog("DB install error: " . $e->getMessage());
            Model::rollback();
        }
    }

    /**
     * Creates DB table if not exist
     *
     * @return bool
     */
    private function createDBVersionTable()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $res = $this->dbClient->createTableQ(
            $this->tbl_name,
            "`id` INT(11) NOT NULL AUTO_INCREMENT, " .
                "`version` INT(11) NOT NULL DEFAULT '0', " .
                "PRIMARY KEY (`id`)",
            TABLE_OPTIONS
        );

        return $res;
    }

    /**
     * Sets new database version
     *
     * @return bool
     */
    private function setVersion($version)
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $version = intval($version);
        if ($version < 0) {
            return false;
        }

        $data = ["version" => $version];
        if ($version == 0) {
            return $this->dbClient->insertQ($this->tbl_name, $data);
        } else {
            return $this->dbClient->updateQ($this->tbl_name, $data, "id=1");
        }
    }

    /**
     * Returns current version of database
     *
     * @return int
     */
    public function getCurrentVersion()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $qResult = $this->dbClient->selectQ("version", $this->tbl_name, "id=1");
        if (!$qResult) {
            throw new \Error("Fail to obtain DB version");
        }

        $row = $this->dbClient->fetchRow($qResult);
        return intval($row["version"]);
    }

    /**
     * Returns latest version of database
     *
     * @return int
     */
    public function getLatestVersion()
    {
        return $this->latestVersion;
    }

    /**
     * Updates database to latest version
     */
    public function autoUpdate()
    {
        try {
            Model::begin();

            $current = $this->getCurrentVersion();
            $latest = $this->getLatestVersion();
            wlog("Current DB version: $current; latest: $latest");
            if ($current == $latest) {
                return;
            }

            while ($current < $this->latestVersion) {
                $next = "version" . ($current + 1);
                $current = $this->$next();
            }

            $this->setVersion($current);

            Model::commit();
        } catch (\Error $e) {
            wlog("DB install error: " . $e->getMessage());
            Model::rollback();
        }
    }

    /**
     * Creates database version 1
     *
     * @return int
     */
    private function version1()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $res = $this->dbClient->changeColumn("currency", "format", "flags", "INT(11) NOT NULL DEFAULT '0'");
        if (!$res) {
            throw new \Error("Fail to update currency table");
        }

        return 1;
    }

    /**
     * Creates database version 2
     *
     * @return int
     */
    private function version2()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $res = $this->dbClient->addColumns("accounts", ["flags" => "INT(11) NOT NULL DEFAULT '0'"]);
        if (!$res) {
            throw new \Error("Fail to update accounts table");
        }

        return 2;
    }

    /**
     * Creates database version 3
     *
     * @return int
     */
    private function version3()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $res = $this->dbClient->addColumns("persons", ["flags" => "INT(11) NOT NULL DEFAULT '0'"]);
        if (!$res) {
            throw new \Error("Fail to update persons table");
        }

        return 3;
    }

    /**
     * Creates database version 4
     *
     * @return int
     */
    private function version4()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $res = $this->dbClient->changeColumn("accounts", "icon", "icon_id", "INT(11) NOT NULL DEFAULT '0'");
        if (!$res) {
            throw new \Error("Fail to update accounts table");
        }

        $this->createIconTable();

        return 4;
    }

    /**
     * Creates database version 5
     *
     * @return int
     */
    private function version5()
    {
        $this->createImportTemplateTable();

        return 5;
    }

    /**
     * Creates database version 6
     *
     * @return int
     */
    private function version6()
    {
        $this->createImportRuleTable();
        $this->createImportActionTable();

        return 6;
    }

    /**
     * Creates database version 7
     *
     * @return int
     */
    private function version7()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "import_tpl";
        $columns = $this->dbClient->getColumns($tableName);
        if (!$columns) {
            throw new \Error("Fail to obtian columns of '$tableName' table");
        }

        if (!isset($columns["user_id"])) {
            $res = $this->dbClient->addColumns($tableName, ["user_id" => "INT(11) NOT NULL"]);
            if (!$res) {
                throw new \Error("Fail to update '$tableName' table");
            }

            $res = $this->dbClient->addKeys($tableName, ["user_id" => "user_id"]);
            if (!$res) {
                throw new \Error("Fail to update '$tableName' table");
            }
        }

        return 7;
    }

    /**
     * Creates database version 8
     *
     * @return int
     */
    private function version8()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "import_rule";
        if ($this->dbClient->isTableExist($tableName)) {
            $columnsToDrop = [
                "parent_id",
                "field_id",
                "operator",
                "value"
            ];

            $columns = $this->dbClient->getColumns($tableName);
            if (!$columns) {
                throw new \Error("Fail to obtian columns of '$tableName' table");
            }

            $toDrop = [];
            foreach ($columnsToDrop as $colName) {
                if (isset($columns[$colName])) {
                    $toDrop[] = $colName;
                }
            }

            if (count($toDrop) > 0) {
                $res = $this->dbClient->dropColumns($tableName, $toDrop);
                if (!$res) {
                    throw new \Error("Fail to update '$tableName' table");
                }
            }
        } else {
            $this->createImportRuleTable();
        }

        $this->createImportConditionTable();

        return 8;
    }

    /**
     * Creates database version 9
     *
     * @return int
     */
    private function version9()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        foreach ($this->tables as $table) {
            $this->dbClient->setTableEngine($table, "InnoDB");
        }

        return 9;
    }

    /**
     * Creates database version 10
     *
     * @return int
     */
    private function version10()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "import_tpl";
        $columns = $this->dbClient->getColumns($tableName);
        if (!$columns) {
            throw new \Error("Fail to obtian columns of '$tableName' table");
        }

        if (!isset($columns["first_row"])) {
            $res = $this->dbClient->addColumns($tableName, ["first_row" => "INT(11) NOT NULL"]);
            if (!$res) {
                throw new \Error("Fail to update '$tableName' table");
            }
        }

        $this->dbClient->updateQ($tableName, ["first_row" => 2]);

        return 10;
    }

    /**
     * Creates database version 11
     *
     * @return int
     */
    private function version11()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        foreach ($this->tables as $table) {
            $this->dbClient->convertTableCharset($table, "utf8mb4");
        }

        return 11;
    }

    /**
     * Creates database version 12
     *
     * @return int
     */
    private function version12()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "import_tpl";
        $columns = $this->dbClient->getColumns($tableName);
        if (!$columns) {
            throw new \Error("Fail to obtian columns of '$tableName' table");
        }

        if (!isset($columns["account_id"])) {
            $res = $this->dbClient->addColumns($tableName, [
                "account_id" => "INT(11) NOT NULL DEFAULT '0'"
            ]);
            if (!$res) {
                throw new \Error("Fail to update '$tableName' table");
            }
        }

        return 12;
    }

    /**
     * Creates database version 13
     *
     * @return int
     */
    private function version13()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $this->createCategoriesTable();

        $tableName = "transactions";
        $columns = $this->dbClient->getColumns($tableName);
        if (!$columns) {
            throw new \Error("Fail to obtian columns of '$tableName' table");
        }

        if (!isset($columns["category_id"])) {
            $res = $this->dbClient->addColumns($tableName, ["category_id" => "INT(11) NOT NULL"]);
            if (!$res) {
                throw new \Error("Fail to update '$tableName' table");
            }

            $res = $this->dbClient->addKeys($tableName, ["category_id" => "category_id"]);
            if (!$res) {
                throw new \Error("Fail to update '$tableName' table");
            }
        }

        return 13;
    }

    /**
     * Creates database version 14
     *
     * @return int
     */
    private function version14()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "import_act";
        $valuesMap = [
            "transferfrom" => "transfer_out",
            "transferto" => "transfer_in",
            "debtfrom" => "debt_out",
            "debtto" => "debt_in",
        ];

        foreach ($valuesMap as $currentType => $newType) {
            $res = $this->dbClient->updateQ(
                $tableName,
                ["value" => $newType],
                ["action_id=1", "value='$currentType'"],
            );
            if (!$res) {
                throw new \Error("Fail to update '$tableName' table");
            }
        }

        return 14;
    }

    /**
     * Creates database version 15
     *
     * @return int
     */
    private function version15()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "icon";

        $valuesMap = [
            "tile-purse" => "ICON_PURSE",
            "tile-safe" => "ICON_SAFE",
            "tile-card" => "ICON_CARD",
            "tile-percent" => "ICON_PERCENT",
            "tile-bank" => "ICON_BANK",
            "tile-cash" => "ICON_CASH",
        ];

        foreach ($valuesMap as $file => $name) {
            $res = $this->dbClient->updateQ(
                $tableName,
                ["name" => $name],
                ["file=" . qnull($file)],
            );
            if (!$res) {
                throw new \Error("Fail to update '$tableName' table");
            }
        }

        return 15;
    }

    /**
     * Creates database version 16
     *
     * @return int
     */
    private function version16()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        if (!$this->dbClient->isTableExist("user_settings")) {
            $this->createUserSettingsTable();

            // Create settings for each user
            $qResult = $this->dbClient->selectQ("id", "users", null, null, "id ASC");
            while ($row = $this->dbClient->fetchRow($qResult)) {
                $data = ["user_id" => intval($row["id"])];
                $insRes = $this->dbClient->insertQ("user_settings", $data);
                if (!$insRes) {
                    throw new \Error("Fail to create user settings");
                }
            }
        }

        // Add 'pos' column to accounts, person and categories tables
        $tables = ["accounts", "persons", "categories"];
        foreach ($tables as $tableName) {
            $columns = $this->dbClient->getColumns($tableName);
            if (!$columns) {
                throw new \Error("Fail to obtian columns of '$tableName' table");
            }

            if (!isset($columns["pos"])) {
                $res = $this->dbClient->addColumns($tableName, ["pos" => "INT(11) NOT NULL"]);
                if (!$res) {
                    throw new \Error("Fail to update '$tableName' table");
                }
            }

            $res = $this->dbClient->updateQ($tableName, ["pos=id"]);
            if (!$res) {
                throw new \Error("Fail to update '$tableName' table");
            }
        }

        return 16;
    }

    /**
     * Creates database version 17
     *
     * @return int
     */
    private function version17()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        if (!$this->dbClient->isTableExist("user_currency")) {
            $this->createUserCurrencyTable();
        }

        return 17;
    }

    /**
     * Creates database version 18
     *
     * @return int
     */
    private function version18()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "currency";

        $columns = $this->dbClient->getColumns($tableName);
        if (!$columns) {
            throw new \Error("Fail to obtian columns of '$tableName' table");
        }

        if (!isset($columns["code"])) {
            $res = $this->dbClient->addColumns($tableName, ["code" => "VARCHAR(64) NOT NULL"]);
            if (!$res) {
                throw new \Error("Fail to update '$tableName' table");
            }

            $res = $this->dbClient->updateQ($tableName, ["code=name"]);
            if (!$res) {
                throw new \Error("Fail to update '$tableName' table");
            }

            $res = $this->dbClient->updateQ($tableName, ["name=CONCAT('CURRENCY_', name)"]);
            if (!$res) {
                throw new \Error("Fail to update '$tableName' table");
            }
        }

        return 18;
    }

    private function updateColumnDecimalType($table, $column)
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $res = $this->dbClient->changeColumn(
            $table,
            $column,
            $column,
            DECIMAL_TYPE . " NOT NULL",
        );
        if (!$res) {
            throw new \Error("Fail to update '$table' table");
        }
    }

    /**
     * Creates database version 19
     *
     * @return int
     */
    private function version19()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "currency";
        $res = $this->dbClient->addColumns($tableName, ["precision" => "INT NOT NULL DEFAULT '2'"]);
        if (!$res) {
            throw new \Error("Fail to update currency table");
        }

        $res = $this->dbClient->updateQ(
            $tableName,
            ["flags=flags|" . CURRENCY_FORMAT_TRAILING_ZEROS],
        );
        if (!$res) {
            throw new \Error("Fail to update '$tableName' table");
        }

        $this->updateColumnDecimalType("accounts", "balance");
        $this->updateColumnDecimalType("accounts", "initbalance");

        $this->updateColumnDecimalType("transactions", "src_amount");
        $this->updateColumnDecimalType("transactions", "dest_amount");
        $this->updateColumnDecimalType("transactions", "src_result");
        $this->updateColumnDecimalType("transactions", "dest_result");

        return 19;
    }

    /**
     * Creates database version 20
     *
     * @return int
     */
    private function version20()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "accounts";
        $res = $this->dbClient->addColumns($tableName, ["type" => "INT NOT NULL DEFAULT '0'"]);
        if (!$res) {
            throw new \Error("Fail to update accounts table");
        }

        return 20;
    }

    /**
     * Creates database version 21
     *
     * @return int
     */
    private function version21()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }
        $tableName = "accounts";
        $res = $this->dbClient->addColumns(
            $tableName,
            ["limit" => DECIMAL_TYPE . " NOT NULL DEFAULT '0'"],
        );
        if (!$res) {
            throw new \Error("Fail to update accounts table");
        }

        return 21;
    }

    /**
     * Creates currency table
     */
    private function createCurrencyTable()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "currency";
        if ($this->dbClient->isTableExist($tableName)) {
            return;
        }

        $res = $this->dbClient->createTableQ(
            $tableName,
            "`id` INT(11) NOT NULL AUTO_INCREMENT, " .
                "`name` VARCHAR(128) NOT NULL, " .
                "`code` VARCHAR(64) NOT NULL, " .
                "`sign` VARCHAR(64) NOT NULL, " .
                "`precision` INT NOT NULL DEFAULT '2', " .
                "`flags` INT(11) NOT NULL DEFAULT '0', " .
                "`createdate` DATETIME NOT NULL, " .
                "`updatedate` DATETIME NOT NULL, " .
                "PRIMARY KEY (`id`)",
            TABLE_OPTIONS
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }

    /**
     * Creates accounts table
     */
    private function createAccountsTable()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "accounts";
        if ($this->dbClient->isTableExist($tableName)) {
            return;
        }

        $res = $this->dbClient->createTableQ(
            $tableName,
            "`id` INT(11) NOT NULL AUTO_INCREMENT, " .
                "`owner_id` INT(11) NOT NULL, " .
                "`user_id` INT(11) NOT NULL, " .
                "`type` INT NOT NULL DEFAULT '0', " .
                "`curr_id` INT(11) NOT NULL, " .
                "`balance` " . DECIMAL_TYPE . " NOT NULL, " .
                "`initbalance` " . DECIMAL_TYPE . " NOT NULL, " .
                "`limit` " . DECIMAL_TYPE . " NOT NULL DEFAULT '0', " .
                "`name` VARCHAR(255) NOT NULL, " .
                "`icon_id` INT(11) NOT NULL DEFAULT '0', " .
                "`flags` INT(11) NOT NULL DEFAULT '0', " .
                "`pos` INT(11) NOT NULL, " .
                "`createdate` DATETIME NOT NULL, " .
                "`updatedate` DATETIME NOT NULL, " .
                "PRIMARY KEY (`id`), " .
                "KEY `user_id` (`user_id`)",
            TABLE_OPTIONS
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }

    /**
     * Creates persons table
     */
    private function createPersonsTable()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "persons";
        if ($this->dbClient->isTableExist($tableName)) {
            return;
        }

        $res = $this->dbClient->createTableQ(
            $tableName,
            "`id` INT(11) NOT NULL AUTO_INCREMENT, " .
                "`name` VARCHAR(255) NOT NULL, " .
                "`user_id` INT(11) NOT NULL, " .
                "`flags` INT(11) NOT NULL, " .
                "`pos` INT(11) NOT NULL, " .
                "`createdate` DATETIME NOT NULL, " .
                "`updatedate` DATETIME NOT NULL, " .
                "PRIMARY KEY (`id`)",
            TABLE_OPTIONS
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }

    /**
     * Creates transactions table
     */
    private function createTransactionsTable()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "transactions";
        if ($this->dbClient->isTableExist($tableName)) {
            return;
        }

        $res = $this->dbClient->createTableQ(
            $tableName,
            "`id` INT(11) NOT NULL AUTO_INCREMENT, " .
                "`user_id` INT(11) NOT NULL, " .
                "`src_id` INT(11) NOT NULL, " .
                "`dest_id` INT(11) NOT NULL, " .
                "`type` INT(11) NOT NULL, " .
                "`src_amount` " . DECIMAL_TYPE . " NOT NULL, " .
                "`dest_amount` " . DECIMAL_TYPE . " NOT NULL, " .
                "`src_curr` INT(11) NOT NULL, " .
                "`dest_curr` INT(11) NOT NULL, " .
                "`date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, " .
                "`comment` text NOT NULL, " .
                "`pos` INT(11) NOT NULL, " .
                "`createdate` DATETIME NOT NULL, " .
                "`updatedate` DATETIME NOT NULL, " .
                "`src_result` " . DECIMAL_TYPE . " NOT NULL, " .
                "`dest_result` " . DECIMAL_TYPE . " NOT NULL, " .
                "PRIMARY KEY (`id`)",
            TABLE_OPTIONS
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }

    /**
     * Creates categories table
     */
    private function createCategoriesTable()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "categories";
        if ($this->dbClient->isTableExist($tableName)) {
            return;
        }

        $res = $this->dbClient->createTableQ(
            $tableName,
            "`id` INT(11) NOT NULL AUTO_INCREMENT, " .
                "`user_id` INT(11) NOT NULL, " .
                "`parent_id` INT(11) NOT NULL, " .
                "`type` INT(11) NOT NULL, " .
                "`name` VARCHAR(255) NOT NULL, " .
                "`pos` INT(11) NOT NULL, " .
                "`createdate` DATETIME NOT NULL, " .
                "`updatedate` DATETIME NOT NULL, " .
                "PRIMARY KEY (`id`)",
            TABLE_OPTIONS
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }

    /**
     * Creates users table
     */
    private function createUsersTable()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "users";
        if ($this->dbClient->isTableExist($tableName)) {
            return;
        }

        $res = $this->dbClient->createTableQ(
            $tableName,
            "`id` INT(11) NOT NULL AUTO_INCREMENT, " .
                "`login` VARCHAR(255) NOT NULL, " .
                "`passhash` VARCHAR(64) NOT NULL, " .
                "`owner_id` INT(11) NOT NULL, " .
                "`access` INT(11) NOT NULL DEFAULT '0', " .
                "`createdate` DATETIME NOT NULL, " .
                "`updatedate` DATETIME NOT NULL, " .
                "PRIMARY KEY (`id`)",
            TABLE_OPTIONS
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }

    /**
     * Creates user settings table
     */
    private function createUserSettingsTable()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "user_settings";
        if ($this->dbClient->isTableExist($tableName)) {
            return;
        }

        $res = $this->dbClient->createTableQ(
            $tableName,
            "`id` INT(11) NOT NULL AUTO_INCREMENT, " .
                "`user_id` INT(11) NOT NULL, " .
                "`sort_accounts` INT(11) NOT NULL DEFAULT 0, " .
                "`sort_persons` INT(11) NOT NULL DEFAULT 0, " .
                "`sort_categories` INT(11) NOT NULL DEFAULT 0, " .
                "PRIMARY KEY (`id`), " .
                "UNIQUE KEY `user_id` (`user_id`)",
            TABLE_OPTIONS
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }

    /**
     * Creates user currency table
     */
    private function createUserCurrencyTable()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "user_currency";
        if ($this->dbClient->isTableExist($tableName)) {
            return;
        }

        $res = $this->dbClient->createTableQ(
            $tableName,
            "`id` INT(11) NOT NULL AUTO_INCREMENT, " .
                "`user_id` INT(11) NOT NULL, " .
                "`curr_id` INT(11) NOT NULL, " .
                "`pos` INT(11) NOT NULL, " .
                "`flags` INT(11) NOT NULL DEFAULT 0, " .
                "`createdate` DATETIME NOT NULL, " .
                "`updatedate` DATETIME NOT NULL, " .
                "PRIMARY KEY (`id`), " .
                "INDEX `user_id` (`user_id`)",
            TABLE_OPTIONS
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }

    /**
     * Creates icons table
     */
    private function createIconTable()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "icon";
        if ($this->dbClient->isTableExist($tableName)) {
            return;
        }

        $res = $this->dbClient->createTableQ(
            $tableName,
            "`id` INT(11) NOT NULL AUTO_INCREMENT, " .
                "`name` VARCHAR(128) NOT NULL, " .
                "`file` VARCHAR(256) NOT NULL, " .
                "`type` INT(11) NOT NULL DEFAULT '0', " .
                "`createdate` DATETIME NOT NULL, " .
                "`updatedate` DATETIME NOT NULL, " .
                "PRIMARY KEY (`id`)",
            TABLE_OPTIONS
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }

        $data = [
            ["name" => "ICON_PURSE", "file" => "tile-purse", "type" => ICON_TILE],
            ["name" => "ICON_SAFE", "file" => "tile-safe", "type" => ICON_TILE],
            ["name" => "ICON_CARD", "file" => "tile-card", "type" => ICON_TILE],
            ["name" => "ICON_PERCENT", "file" => "tile-percent", "type" => ICON_TILE],
            ["name" => "ICON_BANK", "file" => "tile-bank", "type" => ICON_TILE],
            ["name" => "ICON_CASH", "file" => "tile-cash", "type" => ICON_TILE],
        ];

        $iconModel = IconModel::getInstance();
        $iconModel->createMultiple($data);
    }

    /**
     * Creates import tamplates table
     */
    private function createImportTemplateTable()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "import_tpl";
        if ($this->dbClient->isTableExist($tableName)) {
            wlog("Table '$tableName' already exist");
            return;
        }

        $res = $this->dbClient->createTableQ(
            $tableName,
            "`id` INT(11) NOT NULL AUTO_INCREMENT, " .
                "`name` VARCHAR(128) NOT NULL, " .
                "`type_id` INT(11) NOT NULL DEFAULT '0', " .
                "`user_id` INT(11) NOT NULL DEFAULT '0', " .
                "`account_id` INT(11) NOT NULL DEFAULT '0', " .
                "`first_row` INT(11) NOT NULL DEFAULT '0', " .
                "`date_col` INT(11) NOT NULL DEFAULT '0', " .
                "`comment_col` INT(11) NOT NULL DEFAULT '0', " .
                "`trans_curr_col` INT(11) NOT NULL DEFAULT '0', " .
                "`trans_amount_col` INT(11) NOT NULL DEFAULT '0', " .
                "`account_curr_col` INT(11) NOT NULL DEFAULT '0', " .
                "`account_amount_col` INT(11) NOT NULL DEFAULT '0', " .
                "`createdate` DATETIME NOT NULL, " .
                "`updatedate` DATETIME NOT NULL, " .
                "PRIMARY KEY (`id`), " .
                "KEY `user_id` (`user_id`)",
            TABLE_OPTIONS
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }

    /**
     * Creates import rules table
     */
    private function createImportRuleTable()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "import_rule";
        if ($this->dbClient->isTableExist($tableName)) {
            return;
        }
        $res = $this->dbClient->createTableQ(
            $tableName,
            "`id` INT(11) NOT NULL AUTO_INCREMENT, " .
                "`user_id` INT(11) NOT NULL DEFAULT '0', " .
                "`flags` INT(11) NOT NULL DEFAULT '0', " .
                "`createdate` DATETIME NOT NULL, " .
                "`updatedate` DATETIME NOT NULL, " .
                "PRIMARY KEY (`id`)",
            TABLE_OPTIONS
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }

    /**
     * Creates import conditions table
     */
    private function createImportConditionTable()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "import_cond";
        if ($this->dbClient->isTableExist($tableName)) {
            return;
        }
        $res = $this->dbClient->createTableQ(
            $tableName,
            "`id` INT(11) NOT NULL AUTO_INCREMENT, " .
                "`user_id` INT(11) NOT NULL DEFAULT '0', " .
                "`rule_id` INT(11) NOT NULL DEFAULT '0', " .
                "`field_id` INT(11) NOT NULL DEFAULT '0', " .
                "`operator` INT(11) NOT NULL DEFAULT '0', " .
                "`flags` INT(11) NOT NULL DEFAULT '0', " .
                "`value` VARCHAR(255) NOT NULL, " .
                "`createdate` DATETIME NOT NULL, " .
                "`updatedate` DATETIME NOT NULL, " .
                "PRIMARY KEY (`id`)",
            TABLE_OPTIONS
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }

    /**
     * Creates import actions table
     */
    private function createImportActionTable()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "import_act";
        if ($this->dbClient->isTableExist($tableName)) {
            return;
        }
        $res = $this->dbClient->createTableQ(
            $tableName,
            "`id` INT(11) NOT NULL AUTO_INCREMENT, " .
                "`user_id` INT(11) NOT NULL DEFAULT '0', " .
                "`rule_id` INT(11) NOT NULL DEFAULT '0', " .
                "`action_id` INT(11) NOT NULL DEFAULT '0', " .
                "`value` VARCHAR(255) NOT NULL, " .
                "`createdate` DATETIME NOT NULL, " .
                "`updatedate` DATETIME NOT NULL, " .
                "PRIMARY KEY (`id`)",
            TABLE_OPTIONS
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }

    /**
     * Creates admin queries table
     */
    private function createAdminQueryTable()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "admin_query";
        if ($this->dbClient->isTableExist($tableName)) {
            return;
        }

        $res = $this->dbClient->createTableQ(
            $tableName,
            "`id` INT(11) NOT NULL AUTO_INCREMENT, " .
                "`title` VARCHAR(255) NOT NULL, " .
                "`query` TEXT NOT NULL, " .
                "`flags` INT(11) NOT NULL DEFAULT '0', " .
                "PRIMARY KEY (`id`)",
            "DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_general_ci"
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }
}
