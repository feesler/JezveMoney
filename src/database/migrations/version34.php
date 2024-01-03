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

        $tableName = "admin_query";
        $res = $client->dropTableQ($tableName);
        if (!$res) {
            throw new \Error("Failed to drop table '$tableName'");
        }

        return true;
    }
};
