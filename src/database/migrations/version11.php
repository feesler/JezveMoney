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

        foreach ($database->tables as $table) {
            $client->convertTableCharset($table, "utf8mb4");
        }

        return true;
    }
};
