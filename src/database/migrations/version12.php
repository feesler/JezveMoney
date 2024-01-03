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

        $tableName = "import_tpl";
        $columns = $client->getColumns($tableName);
        if (!$columns) {
            throw new \Error("Failed to obtain columns of table '$tableName'");
        }

        if (!isset($columns["account_id"])) {
            $res = $client->addColumns($tableName, [
                "account_id" => "INT(11) NOT NULL DEFAULT '0'"
            ]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }
        }

        return true;
    }
};
