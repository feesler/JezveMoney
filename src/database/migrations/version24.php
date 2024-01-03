<?php

use function JezveMoney\Core\qnull;

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
            ["decimal_locale" => "VARCHAR(64) NOT NULL",],
        );
        if (!$res) {
            throw new \Error("Failed to update table '$tableName'");
        }

        $res = $client->updateQ($tableName, [
            "date_locale=" . qnull(DEFAULT_LOCALE),
            "decimal_locale=" . qnull(DEFAULT_LOCALE),
        ]);
        if (!$res) {
            throw new \Error("Failed to update table '$tableName'");
        }

        return true;
    }
};
