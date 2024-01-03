<?php

use function JezveMoney\Core\orJoin;
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

        $database->createColorsTable();

        $initialColors = [
            "#5f0f40",
            "#9a031e",
            "#fb8b24",
            "#e36414",
            "#0f4c5c",
            "#390099",
            "#55dde0",
            "#ffbe0b",
            "#fd8a09",
            "#fb5607",
            "#fd2b3b",
            "#ff006e",
            "#c11cad",
            "#a22acd",
            "#8338ec",
            "#3a86ff",
            "#4c91ff",
        ];

        $data = [];
        foreach ($initialColors as $color) {
            $now = date("Y-m-d H:i:s");
            $data[] = [
                "id" => null,
                "value" => colorToInt($color),
                "type" => 0,
                "createdate" => $now,
                "updatedate" => $now,
            ];
        }
        if (!$client->insertMultipleQ("colors", $data)) {
            throw new \Error("insertMultipleQ failed");
        }

        // Set colors of categories from predefined values
        $users = [];
        $qResult = $client->selectQ("id", "users", null, null, "id ASC");
        while ($row = $client->fetchRow($qResult)) {
            $users[] = intval($row["id"]);
        }

        foreach ($users as $user_id) {
            $categories = [];
            $qResult = $client->selectQ(
                "id",
                "categories",
                ["user_id=" . qnull($user_id), "parent_id=" . qnull(0)],
                null,
                "id ASC",
            );
            while ($row = $client->fetchRow($qResult)) {
                $categories[] = intval($row["id"]);
            }

            $index = 0;
            foreach ($categories as $category_id) {
                $res = $client->updateQ(
                    "categories",
                    ["color" => colorToInt($initialColors[$index])],
                    orJoin(["id=" . qnull($category_id), "parent_id=" . qnull($category_id)]),
                );
                if (!$res) {
                    throw new \Error("Failed to update table 'categories'");
                }

                $index++;
            }
        }

        return true;
    }
};
