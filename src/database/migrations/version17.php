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

        if (!$client->isTableExist("user_currency")) {
            $database->createUserCurrencyTable();
        }

        return true;
    }
};
