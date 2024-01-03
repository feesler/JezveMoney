<?php

return new class
{
    public static function run(mixed $client, mixed $database)
    {
        if (!$client) {
            throw new \Error("Invalid DB client");
        }

        $res = $client->addColumns("accounts", ["flags" => "INT(11) NOT NULL DEFAULT '0'"]);
        if (!$res) {
            throw new \Error("Failed to update accounts table");
        }

        return true;
    }
};
