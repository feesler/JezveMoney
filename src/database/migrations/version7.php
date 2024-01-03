<?php

return new class
{
    public static function run(mixed $client, mixed $database)
    {
        if (!$client) {
            throw new \Error("Invalid DB client");
        }

        $tableName = "import_tpl";
        $columns = $client->getColumns($tableName);
        if (!$columns) {
            throw new \Error("Failed to obtain columns of table '$tableName'");
        }

        if (!isset($columns["user_id"])) {
            $res = $client->addColumns($tableName, ["user_id" => "INT(11) NOT NULL"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }

            $res = $client->addKeys($tableName, ["user_id" => "user_id"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }
        }

        return true;
    }
};
