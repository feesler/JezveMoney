<?php

namespace JezveMoney\Core;

/**
 * JSON encoder/decoder class
 */
class JSON
{
    /**
     * Returns object decoded JSON string
     *
     * @param string $jsonData
     * @param bool $asArray if true converts result to array
     * @param int $depth
     *
     * @return mixed
     */
    public static function decode(string $jsonData, bool $asArray = false, int $depth = 512)
    {
        if (is_null($jsonData) || $jsonData == "") {
            return null;
        }

        $fdata = rawurldecode($jsonData);

        if (PHP_VERSION_ID >= 70300) {
            $decodedData = json_decode($fdata, $asArray, $depth, JSON_THROW_ON_ERROR);
        } else {
            $decodedData = json_decode($fdata, $asArray, $depth);
            $js_err = json_last_error();
            if ($js_err != JSON_ERROR_NONE) {
                throw new \Exception(json_last_error_msg());
            }
        }

        return $decodedData;
    }

    /**
     * Returns JSON string encoded from specified object
     *
     * @param mixed $obj
     *
     * @return string
     */
    public static function encode(mixed $obj)
    {
        if (PHP_VERSION_ID >= 50400) {
            return json_encode($obj, JSON_UNESCAPED_UNICODE);
        } else {
            return preg_replace_callback(
                '/((\\\u[01-9a-fA-F]{4})+)/',
                function ($matches) {
                    return json_decode('"' . $matches[1] . '"');
                },
                json_encode($obj)
            );
        }
    }

    /**
     * Returns file decoded as JSON
     *
     * @param string $fileName
     * @param bool $asArray if true converts result to array
     *
     * @return mixed
     */
    public static function fromFile(string $fileName, bool $asArray = false)
    {
        $res = null;

        try {
            $rawData = file_get_contents($fileName);
            $res = JSON::decode($rawData, $asArray);
        } catch (\Error $e) {
            wlog($e->getMessage());
        }

        return $res;
    }
}
