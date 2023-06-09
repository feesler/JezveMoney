<?php

namespace JezveMoney\Core;

use Aura\Accept\AcceptFactory;

/**
 * Locale class
 */
class Locale
{
    private static $tokens = null;

    /**
     * Returns user preferred locale
     *
     * @return string
     */
    public static function getUserLocale()
    {
        if (!isset($_COOKIE["locale"])) {
            $availLocales = self::getAvailable();

            $factory = new AcceptFactory($_SERVER);
            $accept = $factory->newInstance();

            $language = $accept->negotiateLanguage($availLocales);
            return $language->getValue();
        }

        $locale = $_COOKIE["locale"];
        if (!self::isExists($locale)) {
            return DEFAULT_LOCALE;
        }

        return $locale;
    }

    /**
     * Returns array of available locales
     *
     * @return string[]
     */
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

    /**
     * Returns file name for locale
     *
     * @param string $locale
     *
     * @return string
     */
    public static function getFileName(string $locale)
    {
        return APP_ROOT . "lang/" . $locale . ".json";
    }

    /**
     * Returns true if specified locale exists
     *
     * @param string $locale
     *
     * @return bool
     */
    public static function isExists(string $locale)
    {
        return file_exists(self::getFileName($locale));
    }

    /**
     * Loads specified locale
     *
     * @param string $locale
     */
    public static function load(string $locale)
    {
        if (!self::isExists($locale)) {
            throw new \Error("Locale not found");
        }

        static::$tokens = JSON::fromFile(self::getFileName($locale), true);
    }

    /**
     * Loads user preferred locale
     */
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
    public static function getString(string $token)
    {
        if (!is_array(static::$tokens)) {
            throw new \Error("Locale not loaded");
        }
        if (!is_string($token) || $token === "") {
            throw new \Error("Invalid token");
        }

        $tokenPath = explode(".", $token);
        $res = static::$tokens;
        $validPath = [];
        foreach ($tokenPath as $key) {
            $res = $res[$key] ?? null;
            $validPath[] = $key;
            if (is_null($res)) {
                $notFound = implode(".", $validPath);
                throw new \Error("Token '$notFound' not found");
            }
        }

        return $res;
    }
}
