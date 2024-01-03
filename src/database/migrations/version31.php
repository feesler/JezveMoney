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

        $database->createIntervalOffsetTable();

        $tableName = "scheduled_transactions";
        $columns = $client->getColumns($tableName);
        if (!$columns) {
            throw new \Error("Failed to obtian columns of table '$tableName'");
        }

        $offsetsTable = "interval_offset";
        if (isset($columns["interval_offset"])) {
            $qResult = $client->selectQ(
                ["id", "user_id", "interval_type", "interval_offset"],
                $tableName,
                "interval_offset<>0",
            );
            if (!$qResult) {
                throw new \Error("Failed to real scheduled transactions");
            }

            $offsets = [];
            while ($row = $client->fetchRow($qResult)) {
                $intervalType = intval($row["interval_type"]);
                $intervalOffset = intval($row["interval_offset"]);

                if ($intervalType === INTERVAL_YEAR) {
                    $monthIndex = floor($intervalOffset / 100);
                    $dayindex = $intervalOffset % 100;
                } else {
                    $monthIndex = 0;
                    $dayindex = $intervalOffset;
                }

                $offsetItem = [
                    "id" => null,
                    "user_id" => intval($row["user_id"]),
                    "schedule_id" => intval($row["id"]),
                    "month_offset" => $monthIndex,
                    "day_offset" => $dayindex,
                ];

                unset($row);

                $offsets[] = $offsetItem;
            }

            if (!$client->insertMultipleQ($offsetsTable, $offsets)) {
                throw new \Error("insertMultipleQ failed");
            }

            $res = $client->dropColumns($tableName, ["interval_offset"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }
        }

        return true;
    }
};
