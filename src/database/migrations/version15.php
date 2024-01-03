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

        $tableName = "icon";
        $valuesMap = [
            "tile-purse" => "ICON_PURSE",
            "tile-safe" => "ICON_SAFE",
            "tile-card" => "ICON_CARD",
            "tile-percent" => "ICON_PERCENT",
            "tile-bank" => "ICON_BANK",
            "tile-cash" => "ICON_CASH",
        ];

        foreach ($valuesMap as $file => $name) {
            $res = $client->updateQ(
                $tableName,
                ["name" => $name],
                ["file=" . qnull($file)],
            );
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }
        }

        return true;
    }
};
