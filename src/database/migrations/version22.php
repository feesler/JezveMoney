<?php

use const JezveMoney\Core\DECIMAL_TYPE;

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

        $tableName = "accounts";
        $res = $client->addColumns(
            $tableName,
            ["initlimit" => DECIMAL_TYPE . " NOT NULL DEFAULT '0'"],
        );
        if (!$res) {
            throw new \Error("Failed to update table '$tableName'");
        }

        return true;
    }
};
