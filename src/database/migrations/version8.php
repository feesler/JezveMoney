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

        $tableName = "import_rule";
        if ($client->isTableExist($tableName)) {
            $columnsToDrop = [
                "parent_id",
                "field_id",
                "operator",
                "value"
            ];

            $columns = $client->getColumns($tableName);
            if (!$columns) {
                throw new \Error("Failed to obtain columns of table '$tableName'");
            }

            $toDrop = [];
            foreach ($columnsToDrop as $colName) {
                if (isset($columns[$colName])) {
                    $toDrop[] = $colName;
                }
            }

            if (count($toDrop) > 0) {
                $res = $client->dropColumns($tableName, $toDrop);
                if (!$res) {
                    throw new \Error("Failed to update table '$tableName'");
                }
            }
        } else {
            $database->createImportRuleTable();
        }

        $database->createImportConditionTable();

        return true;
    }
};
