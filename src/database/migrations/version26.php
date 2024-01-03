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

        $defaultDateLocale = "ru";
        $tableName = "import_tpl";
        $res = $client->addColumns(
            $tableName,
            ["date_locale" => "VARCHAR(64) NOT NULL"],
        );
        if (!$res) {
            throw new \Error("Failed to update table '$tableName'");
        }

        $res = $client->updateQ($tableName, [
            "date_locale=" . qnull($defaultDateLocale),
        ]);
        if (!$res) {
            throw new \Error("Failed to update table '$tableName'");
        }

        return true;
    }
};
