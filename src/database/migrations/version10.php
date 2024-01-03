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

        $tableName = "import_tpl";
        $columns = $client->getColumns($tableName);
        if (!$columns) {
            throw new \Error("Failed to obtain columns of table '$tableName'");
        }

        if (!isset($columns["first_row"])) {
            $res = $client->addColumns($tableName, ["first_row" => "INT(11) NOT NULL"]);
            if (!$res) {
                throw new \Error("Failed to update table '$tableName'");
            }
        }

        $client->updateQ($tableName, ["first_row" => 2]);

        return true;
    }
};
