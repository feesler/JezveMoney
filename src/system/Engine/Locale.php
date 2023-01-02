<?php

namespace JezveMoney\Core;

class Locale
{
    private static $tokens = null;


    public static function getUserLocale()
    {
        if (!isset($_COOKIE["locale"])) {
            $availLocales = self::getAvailable();
            $locale = isset($_SERVER["HTTP_ACCEPT_LANGUAGE"])
                ? locale_accept_from_http($_SERVER["HTTP_ACCEPT_LANGUAGE"])
                : "";
            $locale = locale_lookup($availLocales, $locale, false, DEFAULT_LOCALE);
            return locale_get_primary_language($locale);
        }

        $locale = $_COOKIE["locale"];
        if (!self::isExists($locale)) {
            return DEFAULT_LOCALE;
        }

        return $locale;
    }


    public static function getAvailable()
    {
        $files = glob(self::getFileName("*"));
        if ($files === false || count($files) === 0) {
            return [];
        }

        $res = [];
        foreach ($files as $file) {
            if (!is_file($file)) {
                continue;
            }

            $path = pathinfo($file);
            $res[] = $path["filename"];
        }

        return $res;
    }


    public static function getFileName($locale)
    {
        return APP_ROOT . "lang/" . $locale . ".json";
    }


    public static function isExists($locale)
    {
        return file_exists(self::getFileName($locale));
    }


    public static function load($locale)
    {
        if (!self::isExists($locale)) {
            throw new \Error("Locale not found");
        }

        static::$tokens = JSON::fromFile(self::getFileName($locale), true);
    }


    public static function loadUserLocale()
    {
        self::load(self::getUserLocale());
    }


    /**
     * Returns locale string for specified token
     *
     * @param string $token - token name
     *
     * @return string
     */
    public static function getString($token)
    {
        if (!is_array(static::$tokens)) {
            throw new \Error("Locale not loaded");
        }
        if (!is_string($token) || $token === "") {
            throw new \Error("Invalid token");
        }
        if (!isset(static::$tokens[$token])) {
            throw new \Error("Token '$token' not found");
        }

        return static::$tokens[$token];
    }
}
