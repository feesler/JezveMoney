<?php

return new class
{
    public static function run(mixed $client, mixed $database)
    {
        if (!$client) {
            throw new \Error("Invalid DB client");
        }
        if (!$database) {
            throw new \Error("Invalid database");
        }

        if (!$client->isTableExist("user_settings")) {
            $database->createUserSettingsTable();

            // Create settings for each user
            $qResult = $client->selectQ("id", "users", null, null, "id ASC");
            while ($row = $client->fetchRow($qResult)) {
                $data = ["user_id" => intval($row["id"])];
                $insRes = $client->insertQ("user_settings", $data);
                if (!$insRes) {
                    throw new \Error("Failed to create user settings");
                }
            }
        }

        // Add 'pos' column to accounts, person and categories tables
        $tables = ["accounts", "persons", "categories"];
        foreach ($tables as $tableName) {
            $columns = $client->getColumns($tableName);
            if (!$columns) {
                throw new \Error("Failed to obtain columns of table '$tableName'");
            }

            if (!isset($columns["pos"])) {
                $res = $client->addColumns($tableName, ["pos" => "INT(11) NOT NULL"]);
                if (!$res) {
                    throw new \Error("Failed to update table '$tableName'");
                }
            }

            $res = $client->updateQ($tableName, ["pos=id"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }
        }

        return true;
    }
};
