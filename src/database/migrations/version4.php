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

        $res = $client->changeColumn("accounts", "icon", "icon_id", "INT(11) NOT NULL DEFAULT '0'");
        if (!$res) {
            throw new \Error("Failed to update accounts table");
        }

        $database->createIconTable();

        return true;
    }
};
