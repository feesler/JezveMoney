<?php

namespace JezveMoney\Core;

/**
 * System settings
 */
class Settings
{
    protected static $filename = SETTINGS_PATH . "settings.ini";
    private static $cache = null;

    /**
     * Updates cache
     */
    protected static function updateCache()
    {
        self::$cache = [];

        if (!file_exists(self::$filename) || !is_readable(self::$filename)) {
            return;
        }

        self::$cache = parse_ini_file(self::$filename);
    }

    /**
     * Checks state of cache and update if needed
     *
     * @return bool
     */
    protected static function checkCache()
    {
        if (!is_array(self::$cache)) {
            self::updateCache();
        }

        return is_array(self::$cache);
    }

    /**
     * Cleans cached data. Next getCache() request will update cache
     */
    protected static function cleanCache()
    {
        self::$cache = null;
    }

    /**
     * Writes current settings cache to ini file
     *
     * @return bool
     */
    protected static function writeToIni()
    {
        if (!is_array(self::$cache)) {
            return false;
        }
        if (file_exists(self::$filename) && !is_writable(self::$filename)) {
            return false;
        }

        $str = "";
        foreach (self::$cache as $name => $value) {
            $str .= $name . "=" . $value . "\n";
        }

        $res = file_put_contents(self::$filename, $str);
        return $res !== false;
    }

    /**
     * Returns list of settings or null if
     *
     * @return array|null
     */
    public static function getData()
    {
        if (!self::checkCache() || !is_array(self::$cache)) {
            return null;
        }

        $itemsArr = [];
        foreach (self::$cache as $name => $value) {
            $itemsArr[] = [
                "name" => $name,
                "value" => $value,
            ];
        }

        return $itemsArr;
    }

    /**
     * Sets setting value
     *
     * @param string $name setting name
     * @param string $value setting value
     *
     * @return bool
     */
    public static function setValue(string $name, string $value)
    {
        if (!self::checkCache() || !is_array(self::$cache)) {
            return false;
        }

        self::$cache[$name] = $value;

        self::writeToIni();

        return true;
    }

    /**
     * Removes setting by name
     *
     * @param string $name setting name
     *
     * @return bool
     */
    public static function del(string $name)
    {
        if (!self::checkCache() || !is_array(self::$cache)) {
            return false;
        }

        if (isset(self::$cache[$name])) {
            unset(self::$cache[$name]);
        }

        self::writeToIni();

        return true;
    }

    /**
     * Returns value of setting or default value if setting not found
     *
     * @param string $name setting name
     * @param mixed $defaultValue value to return if setting not found
     *
     * @return mixed|null
     */
    public static function getValue(string $name, mixed $defaultValue = null)
    {
        if (!self::checkCache() || !is_array(self::$cache)) {
            return null;
        }

        return self::$cache[$name] ?? $defaultValue;
    }
}
