<?php

namespace JezveMoney\Core;

use JezveMoney\App\Model\IconModel;

class DBVersion
{
    use Singleton;

    protected $tbl_name = "dbver";
    protected $latestVersion = 8;
    protected $dbClient = null;


    protected function onStart()
    {
        $this->dbClient = MySqlDB::getInstance();

        if (!$this->dbClient->isTableExist($this->tbl_name)) {
            $this->install();
        }
    }


    // Create all tables
    private function install()
    {
        $this->createCurrencyTable();
        $this->createAccountsTable();
        $this->createPersonsTable();
        $this->createTransactionsTable();
        $this->createUsersTable();
        $this->createIconTable();
        $this->createImportTemplateTable();
        $this->createImportRuleTable();
        $this->createImportConditionTable();
        $this->createImportActionTable();
        $this->createAdminQueryTable();

        $this->createDBVersionTable();
        $this->setVersion($this->latestVersion);
    }


    // Create DB table if not exist
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
            "DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci"
        );

        return $res;
    }


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


    public function getLatestVersion()
    {
        return $this->latestVersion;
    }


    public function autoUpdate()
    {
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

        $this->setVersion($current);
    }


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


    private function version5()
    {
        $this->createImportTemplateTable();

        return 5;
    }


    private function version6()
    {
        $this->createImportRuleTable();
        $this->createImportActionTable();

        return 6;
    }


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
            "DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci"
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }


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
            "DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci"
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }


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
            "DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci"
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }


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
            "DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci"
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }


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
            "DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci"
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }


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
            "DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci"
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
            "DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci"
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }


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
            "DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci"
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }


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
            "DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci"
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }


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
            "DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci"
        );
        if (!$res) {
            throw new \Error("Fail to create table '$tableName'");
        }
    }


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
