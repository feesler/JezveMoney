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

        $tableName = "users";
        $res = $client->updateQ(
            $tableName,
            ["reminders_date" => null],
        );
        if (!$res) {
            throw new \Error("Failed to update table '$tableName'");
        }

        return true;
    }
};
