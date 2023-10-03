<?php

use JezveMoney\Core\Locale;
use JezveMoney\Core\Settings;

define("WHITE_THEME", 0);
define("DARK_THEME", 1);

// Icon types
define("ICON_TILE", 1);

/**
 * Checks request is HTTPS
 *
 * @return bool
 */
function isSecure()
{
    return (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") || $_SERVER["SERVER_PORT"] == 443;
}

/**
 * Writes application boot ups log
 */
function bootLog()
{
    wlog("\r\n==================================================");
    wlog($_SERVER["REQUEST_METHOD"] . " " . $_SERVER["REQUEST_URI"]);
    wlog("BASEURL: " . BASEURL);
    wlog("approot: " . APP_ROOT);
    if (isset($_SERVER["REMOTE_ADDR"])) {
        wlog("IP: " . $_SERVER["REMOTE_ADDR"]);
    }
    wlog("Time: " . date("r"));
    wlog("Headers: ");
    foreach (getallheaders() as $cKey => $cVal) {
        wlog($cKey . ": " . $cVal);
    }

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        wlog("POST data:");
        wlog(file_get_contents('php://input'));
    }
}

/**
 * Writes HTTP response to log
 */
function responseLog()
{
    wlog("=== Response headers =============================");
    foreach (headers_list() as $value) {
        wlog($value);
    }
}

/**
 * Returns true if system logs are enabled
 *
 * @return bool
 */
function isLogsEnabled()
{
    return Settings::getValue("enableLogs", false);
}

/**
 * Initializes logs
 */
function setupLogs()
{
    function wlog(...$args)
    {
        if (!isLogsEnabled()) {
            return;
        }

        \JezveMoney\Core\Logger::write(...$args);
    }

    if (isLogsEnabled()) {
        bootLog();
    }
}

/**
 * Sets location header to redirect page and exit from script
 *
 * @param string $loc
 */
function setLocation(string $loc)
{
    header("Location: " . $loc);
    responseLog();
    exit();
}

/**
 * Returns true if string is null or empty
 *
 * @param mixed $str
 *
 * @return bool
 */
function is_empty(mixed $str)
{
    return is_null($str) || $str == "";
}

/**
 * If specified object is array just return it
 * If object is not array then return array contains it
 *
 * @param mixed $obj
 *
 * @return array
 */
function asArray(mixed $obj)
{
    return is_array($obj) ? $obj : [$obj];
}

/**
 * Converts string to be compatible with HTML
 *
 * @param string|null $str
 * @param bool $lineEnd if true converts line endings to <br> tag
 *
 * @return string
 */
function e(?string $str, bool $lineEnd = false)
{
    if (is_null($str)) {
        return "";
    }

    $str = htmlentities($str, ENT_QUOTES, "UTF-8");
    if ($lineEnd) {
        $str = str_replace(["\r\n", "\r", "\n"], "<br>", $str);
    }

    return $str;
}

/**
 * Returns formatted value
 *
 * @param mixed $val
 * @param array $options array of number format options
 *
 * @return string
 */
function valFormat(mixed $val, array $options = [])
{
    if (!is_numeric($val)) {
        return "";
    }

    $val = floatval($val);

    $formatter = $options["formatter"] ?? null;
    $precision = $options["precision"] ?? 0;
    $trailingZeros = $options["trailingZeros"] ?? false;
    $decimalSeparator = $options["decimalSeparator"] ?? ".";
    $thousandsSeparator = $options["thousandsSeparator"] ?? " ";

    $addTrailingZeros = strval(round($val)) !== strval($val) && $trailingZeros;
    $fractionDigits = ($addTrailingZeros) ? $precision : 0;
    $decimalSeparator = ($addTrailingZeros) ? $decimalSeparator : "";

    if ($formatter) {
        $formatter->setAttribute(NumberFormatter::FRACTION_DIGITS, $fractionDigits);
        return $formatter->format($val);
    }

    return number_format($val, $fractionDigits, $decimalSeparator, $thousandsSeparator);
}

/**
 * Returns value converted to float and rounded
 *
 * @param mixed $value
 * @param int $precision
 *
 * @return float
 */
function normalize(mixed $value, int $precision = 2)
{
    return round(floatval($value), $precision);
}

/**
 * Checks session and start if it is not started yet
 */
function sessionStart()
{
    if (session_id()) {
        return;
    }

    session_start();
}

/**
 * Returns file modification timestamp
 *
 * @param string $file file name
 *
 * @return int|bool
 */
function getModifiedTime(string $file)
{
    if (!is_string($file) || !file_exists(APP_ROOT . $file)) {
        return false;
    }

    return filemtime(APP_ROOT . $file);
}

/**
 * Appends to file name unique string to fix cache issues
 *
 * @param string $file file name
 *
 * @return string
 */
function auto_version(string $file)
{
    $mtime = getModifiedTime($file);
    if ($mtime === false) {
        return $file;
    }

    return $file . "?" . $mtime;
}

/**
 * Returns array of available themes
 *
 * @return array
 */
function getThemes()
{
    return [
        WHITE_THEME => [
            "className" => "white-theme",
            "color" => "#fefefe",
        ],
        DARK_THEME => [
            "className" => "dark-theme",
            "color" => "#202020",
        ],
    ];
}

/**
 * Returns array filtered for zeros
 *
 * @param mixed $arr
 *
 * @return array
 */
function skipZeros(mixed $arr)
{
    $res = [];
    if (!is_array($arr)) {
        $arr = [$arr];
    }

    foreach ($arr as $val) {
        $val = intval($val);
        if ($val) {
            $res[] = $val;
        }
    }

    return $res;
}

/**
 * Copies specified fields from source object and returns result
 *
 * @param mixed $obj
 * @param array $fields
 * @param bool $throw
 *
 * @return array|bool
 */
function copyFields(mixed $obj, array $fields, bool $throw = false)
{
    if (is_null($obj) || !isset($fields) || !is_array($fields)) {
        if ($throw) {
            throw new \Error("Invalid input");
        } else {
            return false;
        }
    }

    if (!is_array($obj)) {
        $obj = (array)$obj;
    }

    $res = [];
    foreach ($fields as $field) {
        if (array_key_exists($field, $obj)) {
            $res[$field] = $obj[$field];
        }
    }

    return $res;
}

/**
 * Checks is all of expected fields present in the array or object
 * Returns array with only expected fields or false if something goes wrong
 *
 * @param mixed $obj
 * @param array $expectedFields
 * @param bool $throw
 *
 * @return array|bool
 */
function checkFields(mixed $obj, array $expectedFields, bool $throw = false)
{
    if (is_null($obj) || !isset($expectedFields) || !is_array($expectedFields)) {
        if ($throw) {
            throw new \Error("Invalid input");
        } else {
            return false;
        }
    }

    if (!is_array($obj)) {
        $obj = (array)$obj;
    }

    $res = [];
    foreach ($expectedFields as $field) {
        if (!array_key_exists($field, $obj)) {
            if ($throw) {
                throw new \Error("Field '$field' not found");
            } else {
                wlog("Field '$field' not found");
                return false;
            }
        }

        $res[$field] = $obj[$field];
    }

    return $res;
}

/**
 * Converts associative array to array of objects {id, name}
 *
 * @param array $data
 *
 * @return array|null
 */
function convertToObjectArray(array $data)
{
    if (!is_array($data)) {
        return null;
    }

    $res = [];
    foreach ($data as $item_id => $value) {
        $item = new \stdClass();
        $item->id = $item_id;
        $item->name = $value;

        $res[] = $item;
    }

    return $res;
}

/**
 * Returns content of specified SVG icon
 *
 * @param string $name icon name
 * @param string|null $className CSS class string
 *
 * @return string
 */
function svgIcon(string $name, string $className = null)
{
    $fileName = APP_ROOT . "view/img/svg/$name.svg";
    if (!file_exists($fileName)) {
        return "";
    }

    $content = file_get_contents($fileName);
    if (!is_null($className)) {
        $content = str_replace("<svg ", "<svg class=\"" . $className . "\" ", $content);
    }

    return $content;
}

/**
 * Return SVG use content for specified icon
 * Related SVG symbols should be available on target page
 *
 * @param string $name icon name
 * @param string|null $className
 *
 * @return string
 */
function useIcon(string $name, string $className = null)
{
    if (is_empty($name)) {
        return "";
    }

    $attrs = "";
    if (!is_null($className)) {
        $attrs = " class=\"" . e($className) . "\"";
    }

    return "<svg$attrs><use xlink:href=\"#$name\"></use></svg>";
}

/**
 * Returns 'hidden' string if condition is true
 *
 * @param bool $cond
 *
 * @return string
 */
function hidden(bool $cond = true)
{
    return ($cond) ? " hidden" : "";
}

/**
 * Returns 'disabled' string if condition is true
 *
 * @param bool $cond
 *
 * @return string
 */
function disabled(bool $cond = true)
{
    return ($cond) ? " disabled" : "";
}

/**
 * Returns 'checked' string if condition is true
 *
 * @param bool $cond
 *
 * @return string
 */
function checked(bool $cond = true)
{
    return ($cond) ? " checked" : "";
}

/**
 * Returns locale string for specified token
 *
 * @param string $token
 *
 * @return string
 */
function __(string $token)
{
    return Locale::getString($token);
}
