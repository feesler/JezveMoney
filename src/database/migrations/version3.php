<?php

return new class
{
    public static function run(mixed $client, mixed $database)
    {
        if (!$client) {
            throw new \Error("Invalid DB client");
        }

        $res = $client->addColumns("persons", ["flags" => "INT(11) NOT NULL DEFAULT '0'"]);
        if (!$res) {
            throw new \Error("Failed to update persons table");
        }

        return true;
    }
};
