<?php

define("EXPENSE", 1);
define("INCOME", 2);
define("TRANSFER", 3);
define("DEBT", 4);

define("ACCOUNT_HIDDEN", 1);

define("PERSON_HIDDEN", 1);

define("WHITE_THEME", 0);
define("DARK_THEME", 1);

// Icon types
define("ICON_TILE", 1);


// Check request is HTTPS
function isSecure()
{
    return (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") || $_SERVER["SERVER_PORT"] == 443;
}


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


function setLogs($enable)
{
    global $noLogs;
    $writeBootLog = ($noLogs && $enable);
    $noLogs = !$enable;
    if ($writeBootLog) {
        bootLog();
    }
}


function setupLogs()
{
    global $noLogs;

    if (!isset($noLogs) || !$noLogs) {
        function wlog($str = null)
        {
            \JezveMoney\Core\Logger::write($str);
        }
        bootLog();
    } else {
        function wlog()
        {
        }
    }
}

// Set location header to redirect page and exit from script
function setLocation($loc)
{
    header("Location: " . $loc);
    exit();
}


// Check string is null or empty
function is_empty($str)
{
    return is_null($str) || $str == "";
}


// If specified object is array just return it
// If object is not array then return array contains it
function asArray($obj)
{
    return is_array($obj) ? $obj : [$obj];
}


// Convert string to be compatible with HTML
function e($str, $lineEnd = false)
{
    $str = htmlentities($str, ENT_QUOTES, "UTF-8");
    if ($lineEnd) {
        $str = str_replace(["\r\n", "\r", "\n"], "<br>", $str);
    }

    return $str;
}


// Format value
function valFormat($format, $val)
{
    if (!is_numeric($val)) {
        return "";
    }

    $val = floatval($val);

    if (strval(round($val)) == strval($val)) {
        $nf = number_format($val, 0, "", " ");
    } else {
        $nf = number_format($val, 2, ".", " ");
    }

    if ($format && $format != "") {
        return sprintf($format, $nf);
    } else {
        return $nf;
    }
}


// Check session and start if it is not started yet
function sessionStart()
{
    if (session_id()) {
        return;
    }

    session_start();
}


// Build URL from base and array of parameters
function urlJoin($base, $params = null, $raw = false)
{
    if (is_empty($base)) {
        return "";
    }

    if (!is_array($params)) {
        return $base;
    }

    $pairs = [];
    $encode = ($raw) ? "rawurlencode" : "urlencode";
    foreach ($params as $pkey => $pval) {
        if (is_array($pval)) {
            foreach ($pval as $akey => $avalue) {
                if (is_string($akey)) {
                    $pairs[] = $encode($pkey) . "[" . $encode($akey) . "]=" . $encode($avalue);
                } elseif (is_numeric($akey)) {
                    $pairs[] = $encode($pkey) . "[]=" . $encode($avalue);
                }
            }
        } elseif (!is_null($pval) && !is_object($pval)) {
            $pairs[] = $encode($pkey) . "=" . $encode($pval);
        }
    }

    $resStr = $base;
    if (count($pairs)) {
        $resStr .= "?";
    }
    $resStr .= implode("&", $pairs);

    return $resStr;
}


// Return file modification timestamp
function getModifiedTime($file)
{
    if (!is_string($file) || !file_exists(APP_ROOT . $file)) {
        return false;
    }

    return filemtime(APP_ROOT . $file);
}


// Append to file name unique string to fix cache issues
function auto_version($file)
{
    $mtime = getModifiedTime($file);
    if ($mtime === false) {
        return $file;
    }

    return $file . "?" . $mtime;
}


function getThemes($base)
{
    $themeFiles = [
        WHITE_THEME => "white-theme.css",
        DARK_THEME => "dark-theme.css"
    ];

    $res = [];
    foreach ($themeFiles as $theme_id => $themeName) {
        $mtime = getModifiedTime($base . $themeName);
        if ($mtime === false) {
            continue;
        }

        $res[$theme_id] = $themeName . "?" . $mtime;
    }

    return $res;
}


function skipZeros($arr)
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


// Check is all of expected fields present in the array or object
// Return array with only expected fields or FALSE if something goes wrong
function checkFields($obj, $expectedFields, $throw = false)
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


// Convert associative array to array of objects {id, name}
function convertToObjectArray($data)
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


// Return content of specified SVG icon
function svgIcon($name)
{
    $fileName = APP_ROOT . "view/img/svg/$name.svg";
    if (!file_exists($fileName)) {
        return "";
    }

    $content = file_get_contents($fileName);
    return $content;
}


// Return SVG use content for specified icon
// Related SVG symbols should be available on target page
function useIcon($name, $width = null, $height = null)
{
    if (is_empty($name)) {
        return "";
    }

    $width = $width ?? 32;
    if (is_int($width)) {
        $width = $width . "px";
    }

    $height = $height ?? $width;

    return "<svg class=\"icon-$name\" width=\"$width\" height=\"$height\">" .
        "<use xlink:href=\"#$name\"></use>" .
        "</svg>";
}
