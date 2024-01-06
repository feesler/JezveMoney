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

        $tableName = "user_settings";
        $res = $client->addColumns(
            $tableName,
            ["rem_group_by_date" => "INT(11) NOT NULL DEFAULT 0"],
        );
        if (!$res) {
            throw new \Error("Failed to update table '$tableName'");
        }

        return true;
    }
};
