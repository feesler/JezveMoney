<?php

use JezveMoney\App\Model\CurrencyModel;

use const JezveMoney\Core\DECIMAL_TYPE;

return new class
{
    public static function updateColumnDecimalType(mixed $client, string $table, string $column)
    {
        if (!$client) {
            throw new \Error("Invalid DB client");
        }

        $res = $client->changeColumn(
            $table,
            $column,
            $column,
            DECIMAL_TYPE . " NOT NULL",
        );
        if (!$res) {
            throw new \Error("Failed to update '$table' table");
        }
    }

    public static function run(mixed $client, mixed $database)
    {
        if (!$client) {
            throw new \Error("Invalid DB client");
        }
        if (!$database) {
            throw new \Error("Invalid database");
        }

        $tableName = "currency";
        $res = $client->addColumns($tableName, ["precision" => "INT NOT NULL DEFAULT '2'"]);
        if (!$res) {
            throw new \Error("Failed to update table '$tableName'");
        }

        $res = $client->updateQ(
            $tableName,
            ["flags=flags|" . CurrencyModel::CURRENCY_FORMAT_TRAILING_ZEROS],
        );
        if (!$res) {
            throw new \Error("Failed to update table '$tableName'");
        }

        static::updateColumnDecimalType($client, "accounts", "balance");
        static::updateColumnDecimalType($client, "accounts", "initbalance");

        static::updateColumnDecimalType($client, "transactions", "src_amount");
        static::updateColumnDecimalType($client, "transactions", "dest_amount");
        static::updateColumnDecimalType($client, "transactions", "src_result");
        static::updateColumnDecimalType($client, "transactions", "dest_result");

        return true;
    }
};
