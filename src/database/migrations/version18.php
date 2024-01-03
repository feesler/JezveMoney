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

        $tableName = "currency";

        $columns = $client->getColumns($tableName);
        if (!$columns) {
            throw new \Error("Failed to obtian columns of table '$tableName'");
        }

        if (!isset($columns["code"])) {
            $res = $client->addColumns($tableName, ["code" => "VARCHAR(64) NOT NULL"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }

            $res = $client->updateQ($tableName, ["code=name"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }

            $res = $client->updateQ($tableName, ["name=CONCAT('CURRENCY_', name)"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }
        }

        return true;
    }
};
