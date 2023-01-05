<?php

namespace JezveMoney\Core;

use JezveMoney\App\Model\IconModel;

const TABLE_OPTIONS = "ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci";

/**
 * Database version manager class
 */
class DBVersion
{
    use Singleton;

    protected $tbl_name = "dbver";
    protected $latestVersion = 13;
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
        "users"
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

            if ($current < 1) {
                $current = $this->version1();
            }
            if ($current < 2) {
                $current = $this->version2();
            }
            if ($current < 3) {
                $current = $this->version3();
            }
            if ($current < 4) {
                $current = $this->version4();
            }
            if ($current < 5) {
                $current = $this->version5();
            }
            if ($current < 6) {
                $current = $this->version6();
            }
            if ($current < 7) {
                $current = $this->version7();
            }
            if ($current < 8) {
                $current = $this->version8();
            }
            if ($current < 9) {
                $current = $this->version9();
            }
            if ($current < 10) {
                $current = $this->version10();
            }
            if ($current < 11) {
                $current = $this->version11();
            }
            if ($current < 12) {
                $current = $this->version12();
            }
            if ($current < 13) {
                $current = $this->version13();
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
                "`sign` VARCHAR(64) NOT NULL, " .
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
                "`curr_id` INT(11) NOT NULL, " .
                "`balance` DECIMAL(15,2) NOT NULL, " .
                "`initbalance` DECIMAL(15,2) NOT NULL, " .
                "`name` VARCHAR(255) NOT NULL, " .
                "`icon_id` INT(11) NOT NULL DEFAULT '0', " .
                "`flags` INT(11) NOT NULL DEFAULT '0', " .
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
                "`src_amount` DECIMAL(15,2) NOT NULL, " .
                "`dest_amount` DECIMAL(15,2) NOT NULL, " .
                "`src_curr` INT(11) NOT NULL, " .
                "`dest_curr` INT(11) NOT NULL, " .
                "`date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, " .
                "`comment` text NOT NULL, " .
                "`pos` INT(11) NOT NULL, " .
                "`createdate` DATETIME NOT NULL, " .
                "`updatedate` DATETIME NOT NULL, " .
                "`src_result` DECIMAL(15,2) NOT NULL, " .
                "`dest_result` DECIMAL(15,2) NOT NULL, " .
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
            ["name" => "Purse", "file" => "tile-purse", "type" => ICON_TILE],
            ["name" => "Safe", "file" => "tile-safe", "type" => ICON_TILE],
            ["name" => "Card", "file" => "tile-card", "type" => ICON_TILE],
            ["name" => "Percent", "file" => "tile-percent", "type" => ICON_TILE],
            ["name" => "Bank", "file" => "tile-bank", "type" => ICON_TILE],
            ["name" => "Cash", "file" => "tile-cash", "type" => ICON_TILE],
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
