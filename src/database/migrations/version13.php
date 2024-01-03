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

        $database->createCategoriesTable();

        $tableName = "transactions";
        $columns = $client->getColumns($tableName);
        if (!$columns) {
            throw new \Error("Failed to obtain columns of table '$tableName'");
        }

        if (!isset($columns["category_id"])) {
            $res = $client->addColumns($tableName, ["category_id" => "INT(11) NOT NULL"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }

            $res = $client->addKeys($tableName, ["category_id" => "category_id"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }
        }

        return true;
    }
};
