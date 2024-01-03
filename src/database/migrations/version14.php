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

        $tableName = "import_act";
        $valuesMap = [
            "transferfrom" => "transfer_out",
            "transferto" => "transfer_in",
            "debtfrom" => "debt_out",
            "debtto" => "debt_in",
        ];

        foreach ($valuesMap as $currentType => $newType) {
            $res = $client->updateQ(
                $tableName,
                ["value" => $newType],
                ["action_id=1", "value='$currentType'"],
            );
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }
        }

        return true;
    }
};
