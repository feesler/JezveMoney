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
            ["date_locale" => "VARCHAR(64) NOT NULL",],
        );
        if (!$res) {
            throw new \Error("Failed to update table '$tableName'");
        }

        return true;
    }
};
