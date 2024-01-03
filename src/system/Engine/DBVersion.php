<?php

namespace JezveMoney\Core;

use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\IconModel;

const TABLE_OPTIONS = "ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci";
const DECIMAL_TYPE = "DECIMAL(25," . CurrencyModel::MAX_PRECISION . ")";

define("DB_VERSION", 36);

/**
 * Database version manager class
 */
class DBVersion
{
    use Singleton;

    protected $tbl_name = "dbver";
    protected $dbClient = null;
    public $tables = [
        "accounts",
        "currency",
        "dbver",
        "colors",
        "icon",
        "import_act",
        "import_cond",
        "import_rule",
        "import_tpl",
        "persons",
        "transactions",
        "scheduled_transactions",
        "interval_offset",
        "reminders",
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
        Model::runTransaction(function () {
            $this->createCurrencyTable();
            $this->createAccountsTable();
            $this->createPersonsTable();
            $this->createTransactionsTable();
            $this->createScheduledTransactionsTable();
            $this->createIntervalOffsetTable();
            $this->createRemindersTable();
            $this->createCategoriesTable();
            $this->createUsersTable();
            $this->createUserSettingsTable();
            $this->createUserCurrencyTable();
            $this->createColorsTable();
            $this->createIconTable();
            $this->createImportTemplateTable();
            $this->createImportRuleTable();
            $this->createImportConditionTable();
            $this->createImportActionTable();

            $this->createDBVersionTable();
            $this->setVersion(DB_VERSION);
        });
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
            [
                "id" => "INT(11) NOT NULL AUTO_INCREMENT",
                "version" => "INT(11) NOT NULL DEFAULT '0'",
                "PRIMARY KEY (`id`)",
            ],
            TABLE_OPTIONS,
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
            throw new \Error("Failed to obtain DB version");
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
        return DB_VERSION;
    }

    /**
     * Updates database to latest version
     */
    public function autoUpdate()
    {
        Model::runTransaction(function () {
            $current = $this->getCurrentVersion();
            $latest = $this->getLatestVersion();
            wlog("Current DB version: $current; latest: $latest");
            if ($current == $latest) {
                return;
            }

            while ($current < $latest) {
                $next = "version" . ($current + 1);
                $path = APP_ROOT . "database/migrations/" . $next . ".php";
                $rpath = realpath($path);
                $migrationClass = (require_once($rpath));

                $migrationClass::run($this->dbClient, $this);

                $current += 1;
            }

            $this->setVersion($current);
        });
    }

    /**
     * Creates currency table
     */
    public function createCurrencyTable()
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
            [
                "id" => "INT(11) NOT NULL AUTO_INCREMENT",
                "name" => "VARCHAR(128) NOT NULL",
                "code" => "VARCHAR(64) NOT NULL",
                "sign" => "VARCHAR(64) NOT NULL",
                "precision" => "INT NOT NULL DEFAULT '2'",
                "flags" => "INT(11) NOT NULL DEFAULT '0'",
                "createdate" => "DATETIME NOT NULL",
                "updatedate" => "DATETIME NOT NULL",
                "PRIMARY KEY (`id`)",
            ],
            TABLE_OPTIONS,
        );
        if (!$res) {
            throw new \Error("Failed to create table '$tableName'");
        }
    }

    /**
     * Creates accounts table
     */
    public function createAccountsTable()
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
            [
                "id" => "INT(11) NOT NULL AUTO_INCREMENT",
                "owner_id" => "INT(11) NOT NULL",
                "user_id" => "INT(11) NOT NULL",
                "type" => "INT NOT NULL DEFAULT '0'",
                "curr_id" => "INT(11) NOT NULL",
                "balance" => DECIMAL_TYPE . " NOT NULL",
                "initbalance" => DECIMAL_TYPE . " NOT NULL",
                "initlimit" => DECIMAL_TYPE . " NOT NULL DEFAULT '0'",
                "limit" => DECIMAL_TYPE . " NOT NULL DEFAULT '0'",
                "name" => "VARCHAR(255) NOT NULL",
                "icon_id" => "INT(11) NOT NULL DEFAULT '0'",
                "flags" => "INT(11) NOT NULL DEFAULT '0'",
                "pos" => "INT(11) NOT NULL",
                "createdate" => "DATETIME NOT NULL",
                "updatedate" => "DATETIME NOT NULL",
                "PRIMARY KEY (`id`)",
                "KEY `user_id` (`user_id`)",
            ],
            TABLE_OPTIONS,
        );
        if (!$res) {
            throw new \Error("Failed to create table '$tableName'");
        }
    }

    /**
     * Creates persons table
     */
    public function createPersonsTable()
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
            [
                "id" => "INT(11) NOT NULL AUTO_INCREMENT",
                "name" => "VARCHAR(255) NOT NULL",
                "user_id" => "INT(11) NOT NULL",
                "flags" => "INT(11) NOT NULL",
                "pos" => "INT(11) NOT NULL",
                "createdate" => "DATETIME NOT NULL",
                "updatedate" => "DATETIME NOT NULL",
                "PRIMARY KEY (`id`)",
            ],
            TABLE_OPTIONS,
        );
        if (!$res) {
            throw new \Error("Failed to create table '$tableName'");
        }
    }

    /**
     * Creates transactions table
     */
    public function createTransactionsTable()
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
            [
                "id" => "INT(11) NOT NULL AUTO_INCREMENT",
                "user_id" => "INT(11) NOT NULL",
                "src_id" => "INT(11) NOT NULL",
                "dest_id" => "INT(11) NOT NULL",
                "type" => "INT(11) NOT NULL",
                "src_amount" => DECIMAL_TYPE . " NOT NULL",
                "dest_amount" => DECIMAL_TYPE . " NOT NULL",
                "src_curr" => "INT(11) NOT NULL",
                "dest_curr" => "INT(11) NOT NULL",
                "date" => "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
                "category_id" => "INT(11) NOT NULL",
                "comment" => "text NOT NULL",
                "pos" => "INT(11) NOT NULL",
                "createdate" => "DATETIME NOT NULL",
                "updatedate" => "DATETIME NOT NULL",
                "src_result" => DECIMAL_TYPE . " NOT NULL",
                "dest_result" => DECIMAL_TYPE . " NOT NULL",
                "PRIMARY KEY (`id`)",
            ],
            TABLE_OPTIONS,
        );
        if (!$res) {
            throw new \Error("Failed to create table '$tableName'");
        }
    }

    /**
     * Creates scheduled transactions table
     */
    public function createScheduledTransactionsTable()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "scheduled_transactions";
        if ($this->dbClient->isTableExist($tableName)) {
            return;
        }

        $res = $this->dbClient->createTableQ(
            $tableName,
            [
                "id" => "INT(11) NOT NULL AUTO_INCREMENT",
                "user_id" => "INT(11) NOT NULL",
                "name" => "VARCHAR(255) NOT NULL",
                "src_id" => "INT(11) NOT NULL",
                "dest_id" => "INT(11) NOT NULL",
                "type" => "INT(11) NOT NULL",
                "src_amount" => DECIMAL_TYPE . " NOT NULL",
                "dest_amount" => DECIMAL_TYPE . " NOT NULL",
                "src_curr" => "INT(11) NOT NULL",
                "dest_curr" => "INT(11) NOT NULL",
                "category_id" => "INT(11) NOT NULL",
                "comment" => "text NOT NULL",
                "interval_type" => "INT(11) NOT NULL",
                "interval_step" => "INT(11) NOT NULL",
                "start_date" => "DATETIME NOT NULL",
                "end_date" => "DATETIME NULL",
                "createdate" => "DATETIME NOT NULL",
                "updatedate" => "DATETIME NOT NULL",
                "PRIMARY KEY (`id`)",
            ],
            TABLE_OPTIONS,
        );
        if (!$res) {
            throw new \Error("Failed to create table '$tableName'");
        }
    }

    /**
     * Creates scheduled transactions interval offsets table
     */
    public function createIntervalOffsetTable()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "interval_offset";
        if ($this->dbClient->isTableExist($tableName)) {
            return;
        }

        $res = $this->dbClient->createTableQ(
            $tableName,
            [
                "id" => "INT(11) NOT NULL AUTO_INCREMENT",
                "user_id" => "INT(11) NOT NULL",
                "schedule_id" => "INT(11) NOT NULL",
                "month_offset" => "INT(11) NOT NULL",
                "day_offset" => "INT(11) NOT NULL",
                "PRIMARY KEY (`id`)",
            ],
            TABLE_OPTIONS,
        );
        if (!$res) {
            throw new \Error("Failed to create table '$tableName'");
        }
    }

    /**
     * Creates scheduled transactions reminders table
     */
    public function createRemindersTable()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "reminders";
        if ($this->dbClient->isTableExist($tableName)) {
            return;
        }

        $res = $this->dbClient->createTableQ(
            $tableName,
            [
                "id" => "INT(11) NOT NULL AUTO_INCREMENT",
                "user_id" => "INT(11) NOT NULL",
                "schedule_id" => "INT(11) NOT NULL",
                "state" => "INT(11) NOT NULL",
                "date" => "DATETIME NOT NULL",
                "transaction_id" => "INT(11) NOT NULL",
                "createdate" => "DATETIME NOT NULL",
                "updatedate" => "DATETIME NOT NULL",
                "PRIMARY KEY (`id`)",
            ],
            TABLE_OPTIONS,
        );
        if (!$res) {
            throw new \Error("Failed to create table '$tableName'");
        }
    }

    /**
     * Creates categories table
     */
    public function createCategoriesTable()
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
            [
                "id" => "INT(11) NOT NULL AUTO_INCREMENT",
                "user_id" => "INT(11) NOT NULL",
                "parent_id" => "INT(11) NOT NULL",
                "type" => "INT(11) NOT NULL",
                "name" => "VARCHAR(255) NOT NULL",
                "color" => "INT(11) NOT NULL",
                "pos" => "INT(11) NOT NULL",
                "createdate" => "DATETIME NOT NULL",
                "updatedate" => "DATETIME NOT NULL",
                "PRIMARY KEY (`id`)",
            ],
            TABLE_OPTIONS,
        );
        if (!$res) {
            throw new \Error("Failed to create table '$tableName'");
        }
    }

    /**
     * Creates users table
     */
    public function createUsersTable()
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
            [
                "id" => "INT(11) NOT NULL AUTO_INCREMENT",
                "login" => "VARCHAR(255) NOT NULL",
                "passhash" => "VARCHAR(64) NOT NULL",
                "owner_id" => "INT(11) NOT NULL",
                "access" => "INT(11) NOT NULL DEFAULT '0'",
                "reminders_date" => "DATETIME NULL DEFAULT NULL",
                "createdate" => "DATETIME NOT NULL",
                "updatedate" => "DATETIME NOT NULL",
                "PRIMARY KEY (`id`)",
            ],
            TABLE_OPTIONS,
        );
        if (!$res) {
            throw new \Error("Failed to create table '$tableName'");
        }
    }

    /**
     * Creates user settings table
     */
    public function createUserSettingsTable()
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
            [
                "id" => "INT(11) NOT NULL AUTO_INCREMENT",
                "user_id" => "INT(11) NOT NULL",
                "sort_accounts" => "INT(11) NOT NULL DEFAULT 0",
                "sort_persons" => "INT(11) NOT NULL DEFAULT 0",
                "sort_categories" => "INT(11) NOT NULL DEFAULT 0",
                "date_locale" => "VARCHAR(64) NOT NULL",
                "decimal_locale" => "VARCHAR(64) NOT NULL",
                "tr_group_by_date" => "INT(11) NOT NULL DEFAULT 0",
                "tz_offset" => "INT(11) NOT NULL DEFAULT 0",
                "PRIMARY KEY (`id`)",
                "UNIQUE KEY `user_id` (`user_id`)",
            ],
            TABLE_OPTIONS,
        );
        if (!$res) {
            throw new \Error("Failed to create table '$tableName'");
        }
    }

    /**
     * Creates user currency table
     */
    public function createUserCurrencyTable()
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
            [
                "id" => "INT(11) NOT NULL AUTO_INCREMENT",
                "user_id" => "INT(11) NOT NULL",
                "curr_id" => "INT(11) NOT NULL",
                "pos" => "INT(11) NOT NULL",
                "flags" => "INT(11) NOT NULL DEFAULT 0",
                "createdate" => "DATETIME NOT NULL",
                "updatedate" => "DATETIME NOT NULL",
                "PRIMARY KEY (`id`)",
                "INDEX `user_id` (`user_id`)",
            ],
            TABLE_OPTIONS,
        );
        if (!$res) {
            throw new \Error("Failed to create table '$tableName'");
        }
    }

    /**
     * Creates colors table
     */
    public function createColorsTable()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "colors";
        if ($this->dbClient->isTableExist($tableName)) {
            return;
        }

        $res = $this->dbClient->createTableQ(
            $tableName,
            [
                "id" => "INT(11) NOT NULL AUTO_INCREMENT",
                "value" => "INT(11) NOT NULL DEFAULT '0'",
                "type" => "INT(11) NOT NULL DEFAULT '0'",
                "createdate" => "DATETIME NOT NULL",
                "updatedate" => "DATETIME NOT NULL",
                "PRIMARY KEY (`id`)",
            ],
            TABLE_OPTIONS,
        );
        if (!$res) {
            throw new \Error("Failed to create table '$tableName'");
        }
    }

    /**
     * Creates icons table
     */
    public function createIconTable()
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
            [
                "id" => "INT(11) NOT NULL AUTO_INCREMENT",
                "name" => "VARCHAR(128) NOT NULL",
                "file" => "VARCHAR(256) NOT NULL",
                "type" => "INT(11) NOT NULL DEFAULT '0'",
                "createdate" => "DATETIME NOT NULL",
                "updatedate" => "DATETIME NOT NULL",
                "PRIMARY KEY (`id`)",
            ],
            TABLE_OPTIONS,
        );
        if (!$res) {
            throw new \Error("Failed to create table '$tableName'");
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
    public function createImportTemplateTable()
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
            [
                "id" => "INT(11) NOT NULL AUTO_INCREMENT",
                "name" => "VARCHAR(128) NOT NULL",
                "type_id" => "INT(11) NOT NULL DEFAULT '0'",
                "user_id" => "INT(11) NOT NULL DEFAULT '0'",
                "account_id" => "INT(11) NOT NULL DEFAULT '0'",
                "first_row" => "INT(11) NOT NULL DEFAULT '0'",
                "date_col" => "INT(11) NOT NULL DEFAULT '0'",
                "comment_col" => "INT(11) NOT NULL DEFAULT '0'",
                "trans_curr_col" => "INT(11) NOT NULL DEFAULT '0'",
                "trans_amount_col" => "INT(11) NOT NULL DEFAULT '0'",
                "account_curr_col" => "INT(11) NOT NULL DEFAULT '0'",
                "account_amount_col" => "INT(11) NOT NULL DEFAULT '0'",
                "date_locale" => "VARCHAR(64) NOT NULL",
                "createdate" => "DATETIME NOT NULL",
                "updatedate" => "DATETIME NOT NULL",
                "PRIMARY KEY (`id`)",
                "KEY `user_id` (`user_id`)",
            ],
            TABLE_OPTIONS,
        );
        if (!$res) {
            throw new \Error("Failed to create table '$tableName'");
        }
    }

    /**
     * Creates import rules table
     */
    public function createImportRuleTable()
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
            [
                "id" => "INT(11) NOT NULL AUTO_INCREMENT",
                "user_id" => "INT(11) NOT NULL DEFAULT '0'",
                "flags" => "INT(11) NOT NULL DEFAULT '0'",
                "createdate" => "DATETIME NOT NULL",
                "updatedate" => "DATETIME NOT NULL",
                "PRIMARY KEY (`id`)",
            ],
            TABLE_OPTIONS,
        );
        if (!$res) {
            throw new \Error("Failed to create table '$tableName'");
        }
    }

    /**
     * Creates import conditions table
     */
    public function createImportConditionTable()
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
            [
                "id" => "INT(11) NOT NULL AUTO_INCREMENT",
                "user_id" => "INT(11) NOT NULL DEFAULT '0'",
                "rule_id" => "INT(11) NOT NULL DEFAULT '0'",
                "field_id" => "INT(11) NOT NULL DEFAULT '0'",
                "operator" => "INT(11) NOT NULL DEFAULT '0'",
                "flags" => "INT(11) NOT NULL DEFAULT '0'",
                "value" => "VARCHAR(255) NOT NULL",
                "createdate" => "DATETIME NOT NULL",
                "updatedate" => "DATETIME NOT NULL",
                "PRIMARY KEY (`id`)",
            ],
            TABLE_OPTIONS,
        );
        if (!$res) {
            throw new \Error("Failed to create table '$tableName'");
        }
    }

    /**
     * Creates import actions table
     */
    public function createImportActionTable()
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
            [
                "id" => "INT(11) NOT NULL AUTO_INCREMENT",
                "user_id" => "INT(11) NOT NULL DEFAULT '0'",
                "rule_id" => "INT(11) NOT NULL DEFAULT '0'",
                "action_id" => "INT(11) NOT NULL DEFAULT '0'",
                "value" => "VARCHAR(255) NOT NULL",
                "createdate" => "DATETIME NOT NULL",
                "updatedate" => "DATETIME NOT NULL",
                "PRIMARY KEY (`id`)",
            ],
            TABLE_OPTIONS,
        );
        if (!$res) {
            throw new \Error("Failed to create table '$tableName'");
        }
    }
}
