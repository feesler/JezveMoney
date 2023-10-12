<?php

namespace JezveMoney\Core;

use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\IconModel;

const TABLE_OPTIONS = "ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci";
const DECIMAL_TYPE = "DECIMAL(25," . CurrencyModel::MAX_PRECISION . ")";

define("DB_VERSION", 34);

/**
 * Database version manager class
 */
class DBVersion
{
    use Singleton;

    protected $tbl_name = "dbver";
    protected $dbClient = null;
    protected $tables = [
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
                $current = $this->$next();
            }

            $this->setVersion($current);
        });
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
            throw new \Error("Failed to update currency table");
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
            throw new \Error("Failed to update accounts table");
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
            throw new \Error("Failed to update persons table");
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
            throw new \Error("Failed to update accounts table");
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
            throw new \Error("Failed to obtain columns of table '$tableName'");
        }

        if (!isset($columns["user_id"])) {
            $res = $this->dbClient->addColumns($tableName, ["user_id" => "INT(11) NOT NULL"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }

            $res = $this->dbClient->addKeys($tableName, ["user_id" => "user_id"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
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
                throw new \Error("Failed to obtain columns of table '$tableName'");
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
                    throw new \Error("Failed to update table '$tableName'");
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
            throw new \Error("Failed to obtain columns of table '$tableName'");
        }

        if (!isset($columns["first_row"])) {
            $res = $this->dbClient->addColumns($tableName, ["first_row" => "INT(11) NOT NULL"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
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
            throw new \Error("Failed to obtain columns of table '$tableName'");
        }

        if (!isset($columns["account_id"])) {
            $res = $this->dbClient->addColumns($tableName, [
                "account_id" => "INT(11) NOT NULL DEFAULT '0'"
            ]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
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
            throw new \Error("Failed to obtain columns of table '$tableName'");
        }

        if (!isset($columns["category_id"])) {
            $res = $this->dbClient->addColumns($tableName, ["category_id" => "INT(11) NOT NULL"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }

            $res = $this->dbClient->addKeys($tableName, ["category_id" => "category_id"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
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
                throw new \Error("Failed to update table '$tableName'");
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
                throw new \Error("Failed to update table '$tableName'");
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
                    throw new \Error("Failed to create user settings");
                }
            }
        }

        // Add 'pos' column to accounts, person and categories tables
        $tables = ["accounts", "persons", "categories"];
        foreach ($tables as $tableName) {
            $columns = $this->dbClient->getColumns($tableName);
            if (!$columns) {
                throw new \Error("Failed to obtain columns of table '$tableName'");
            }

            if (!isset($columns["pos"])) {
                $res = $this->dbClient->addColumns($tableName, ["pos" => "INT(11) NOT NULL"]);
                if (!$res) {
                    throw new \Error("Failed to update table '$tableName'");
                }
            }

            $res = $this->dbClient->updateQ($tableName, ["pos=id"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
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
            throw new \Error("Failed to obtian columns of table '$tableName'");
        }

        if (!isset($columns["code"])) {
            $res = $this->dbClient->addColumns($tableName, ["code" => "VARCHAR(64) NOT NULL"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }

            $res = $this->dbClient->updateQ($tableName, ["code=name"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }

            $res = $this->dbClient->updateQ($tableName, ["name=CONCAT('CURRENCY_', name)"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
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
            throw new \Error("Failed to update '$table' table");
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
            throw new \Error("Failed to update table '$tableName'");
        }

        $res = $this->dbClient->updateQ(
            $tableName,
            ["flags=flags|" . CurrencyModel::CURRENCY_FORMAT_TRAILING_ZEROS],
        );
        if (!$res) {
            throw new \Error("Failed to update table '$tableName'");
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
            throw new \Error("Failed to update table '$tableName'");
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
            throw new \Error("Failed to update table '$tableName'");
        }

        return 21;
    }

    /**
     * Creates database version 22
     *
     * @return int
     */
    private function version22()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }
        $tableName = "accounts";
        $res = $this->dbClient->addColumns(
            $tableName,
            ["initlimit" => DECIMAL_TYPE . " NOT NULL DEFAULT '0'"],
        );
        if (!$res) {
            throw new \Error("Failed to update table '$tableName'");
        }

        return 22;
    }

    /**
     * Creates database version 23
     *
     * @return int
     */
    private function version23()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }
        $tableName = "user_settings";
        $res = $this->dbClient->addColumns(
            $tableName,
            ["date_locale" => "VARCHAR(64) NOT NULL",],
        );
        if (!$res) {
            throw new \Error("Failed to update table '$tableName'");
        }

        return 23;
    }

    /**
     * Creates database version 24
     *
     * @return int
     */
    private function version24()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }
        $tableName = "user_settings";
        $res = $this->dbClient->addColumns(
            $tableName,
            ["decimal_locale" => "VARCHAR(64) NOT NULL",],
        );
        if (!$res) {
            throw new \Error("Failed to update table '$tableName'");
        }

        $res = $this->dbClient->updateQ($tableName, [
            "date_locale=" . qnull(DEFAULT_LOCALE),
            "decimal_locale=" . qnull(DEFAULT_LOCALE),
        ]);
        if (!$res) {
            throw new \Error("Failed to update table '$tableName'");
        }

        return 24;
    }

    /**
     * Creates database version 25
     *
     * @return int
     */
    private function version25()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }
        $tableName = "user_settings";
        $res = $this->dbClient->addColumns(
            $tableName,
            ["tr_group_by_date" => "INT(11) NOT NULL DEFAULT 0"],
        );
        if (!$res) {
            throw new \Error("Failed to update table '$tableName'");
        }

        return 25;
    }

    /**
     * Creates database version 26
     *
     * @return int
     */
    private function version26()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $defaultDateLocale = "ru";
        $tableName = "import_tpl";
        $res = $this->dbClient->addColumns(
            $tableName,
            ["date_locale" => "VARCHAR(64) NOT NULL"],
        );
        if (!$res) {
            throw new \Error("Failed to update table '$tableName'");
        }

        $res = $this->dbClient->updateQ($tableName, [
            "date_locale=" . qnull($defaultDateLocale),
        ]);
        if (!$res) {
            throw new \Error("Failed to update table '$tableName'");
        }

        return 26;
    }

    /**
     * Creates database version 27
     *
     * @return int
     */
    private function version27()
    {
        $this->createScheduledTransactionsTable();

        return 27;
    }

    /**
     * Creates database version 28
     *
     * @return int
     */
    private function version28()
    {
        $this->createRemindersTable();

        return 28;
    }

    /**
     * Creates database version 29
     *
     * @return int
     */
    private function version29()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "user_settings";
        $columns = $this->dbClient->getColumns($tableName);
        if (!$columns) {
            throw new \Error("Failed to obtian columns of table '$tableName'");
        }

        if (!isset($columns["tz_offset"])) {
            $res = $this->dbClient->addColumns(
                $tableName,
                ["tz_offset" => "INT(11) NOT NULL DEFAULT 0"],
            );
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }
        }

        return 29;
    }

    /**
     * Creates database version 30
     *
     * @return int
     */
    private function version30()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "users";
        $columns = $this->dbClient->getColumns($tableName);
        if (!$columns) {
            throw new \Error("Failed to obtian columns of table '$tableName'");
        }

        if (!isset($columns["reminders_date"])) {
            $res = $this->dbClient->addColumns(
                $tableName,
                ["reminders_date" => "DATETIME NULL"],
            );
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }
        }

        return 30;
    }

    /**
     * Creates database version 31
     *
     * @return int
     */
    private function version31()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $this->createIntervalOffsetTable();

        $tableName = "scheduled_transactions";
        $columns = $this->dbClient->getColumns($tableName);
        if (!$columns) {
            throw new \Error("Failed to obtian columns of table '$tableName'");
        }

        $offsetsTable = "interval_offset";
        if (isset($columns["interval_offset"])) {
            $qResult = $this->dbClient->selectQ(
                ["id", "user_id", "interval_type", "interval_offset"],
                $tableName,
                "interval_offset<>0",
            );
            if (!$qResult) {
                throw new \Error("Failed to real scheduled transactions");
            }

            $offsets = [];
            while ($row = $this->dbClient->fetchRow($qResult)) {
                $intervalType = intval($row["interval_type"]);
                $intervalOffset = intval($row["interval_offset"]);

                if ($intervalType === INTERVAL_YEAR) {
                    $monthIndex = floor($intervalOffset / 100);
                    $dayindex = $intervalOffset % 100;
                } else {
                    $monthIndex = 0;
                    $dayindex = $intervalOffset;
                }

                $offsetItem = [
                    "id" => null,
                    "user_id" => intval($row["user_id"]),
                    "schedule_id" => intval($row["id"]),
                    "month_offset" => $monthIndex,
                    "day_offset" => $dayindex,
                ];

                unset($row);

                $offsets[] = $offsetItem;
            }

            if (!$this->dbClient->insertMultipleQ($offsetsTable, $offsets)) {
                throw new \Error("insertMultipleQ failed");
            }

            $res = $this->dbClient->dropColumns($tableName, ["interval_offset"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }
        }

        return 31;
    }

    /**
     * Creates database version 32
     *
     * @return int
     */
    private function version32()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "categories";
        $columns = $this->dbClient->getColumns($tableName);
        if (!$columns) {
            throw new \Error("Failed to obtian columns of table '$tableName'");
        }

        if (!isset($columns["color"])) {
            $res = $this->dbClient->addColumns(
                $tableName,
                ["color" => "INT(11) NOT NULL"],
            );
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }
        }

        return 32;
    }

    /**
     * Creates database version 33
     *
     * @return int
     */
    private function version33()
    {
        $this->createColorsTable();

        $initialColors = [
            "#5f0f40",
            "#9a031e",
            "#fb8b24",
            "#e36414",
            "#0f4c5c",
            "#390099",
            "#55dde0",
            "#ffbe0b",
            "#fd8a09",
            "#fb5607",
            "#fd2b3b",
            "#ff006e",
            "#c11cad",
            "#a22acd",
            "#8338ec",
            "#3a86ff",
            "#4c91ff",
        ];

        $data = [];
        foreach ($initialColors as $color) {
            $now = date("Y-m-d H:i:s");
            $data[] = [
                "id" => null,
                "value" => colorToInt($color),
                "type" => 0,
                "createdate" => $now,
                "updatedate" => $now,
            ];
        }
        if (!$this->dbClient->insertMultipleQ("colors", $data)) {
            throw new \Error("insertMultipleQ failed");
        }

        // Set colors of categories from predefined values
        $users = [];
        $qResult = $this->dbClient->selectQ("id", "users", null, null, "id ASC");
        while ($row = $this->dbClient->fetchRow($qResult)) {
            $users[] = intval($row["id"]);
        }

        foreach ($users as $user_id) {
            $categories = [];
            $qResult = $this->dbClient->selectQ(
                "id",
                "categories",
                ["user_id=" . qnull($user_id), "parent_id=" . qnull(0)],
                null,
                "id ASC",
            );
            while ($row = $this->dbClient->fetchRow($qResult)) {
                $categories[] = intval($row["id"]);
            }

            $index = 0;
            foreach ($categories as $category_id) {
                $res = $this->dbClient->updateQ(
                    "categories",
                    ["color" => colorToInt($initialColors[$index])],
                    orJoin(["id=" . qnull($category_id), "parent_id=" . qnull($category_id)]),
                );
                if (!$res) {
                    throw new \Error("Failed to update table 'categories'");
                }

                $index++;
            }
        }

        return 33;
    }

    /**
     * Creates database version 34
     *
     * @return int
     */
    private function version34()
    {
        if (!$this->dbClient) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "admin_query";
        $res = $this->dbClient->dropTableQ($tableName);
        if (!$res) {
            throw new \Error("Failed to drop table '$tableName'");
        }

        return 34;
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
    private function createScheduledTransactionsTable()
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
    private function createIntervalOffsetTable()
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
    private function createRemindersTable()
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
    private function createColorsTable()
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
