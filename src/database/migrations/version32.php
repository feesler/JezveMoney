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

        $tableName = "categories";
        $columns = $client->getColumns($tableName);
        if (!$columns) {
            throw new \Error("Failed to obtian columns of table '$tableName'");
        }

        if (!isset($columns["color"])) {
            $res = $client->addColumns(
                $tableName,
                ["color" => "INT(11) NOT NULL"],
            );
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }
        }

        return true;
    }
};
