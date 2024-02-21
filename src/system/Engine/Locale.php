<?php

namespace JezveMoney\Core;

const LANG_DIR = "lang";

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

    /**
     * Returns array of available locales
     *
     * @return string[]
     */
    public static function getAvailable()
    {
        $pattern = APP_ROOT . LANG_DIR . "/*";
        $files = glob($pattern);
        if ($files === false || count($files) === 0) {
            return [];
        }

        $res = [];
        foreach ($files as $file) {
            if (!is_dir($file)) {
                continue;
            }

            $localeCommon = $file . "/common.json";
            if (!is_file($localeCommon)) {
                continue;
            }

            $path = pathinfo($file);
            $res[] = $path["filename"];
        }

        return $res;
    }

    /**
     * Returns relative file path for locale
     *
     * @param string $locale
     *
     * @return string
     */
    public static function getRelativeFileName(string $locale)
    {
        return LANG_DIR . "/$locale/common.json";
    }

    /**
     * Returns relative file path for specified view and locale
     *
     * @param string $viewName
     * @param string $locale
     *
     * @return string
     */
    public static function getRelativeViewFileName(string $viewName, string $locale)
    {
        return LANG_DIR . "/$locale/$viewName/index.json";
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
        return APP_ROOT . static::getRelativeFileName($locale);
    }

    /**
     * Returns file name for specified view and locale
     *
     * @param string $viewName
     * @param string $locale
     *
     * @return string
     */
    public static function getViewFileName(string $viewName, string $locale)
    {
        return APP_ROOT . static::getRelativeViewFileName($viewName, $locale);
    }

    /**
     * Returns true if tokens specified specified view and locale are exists
     *
     * @param string $viewName
     * @param string $locale
     *
     * @return bool
     */
    public static function isViewTokensExists(string $viewName, string $locale)
    {
        return file_exists(self::getViewFileName($viewName, $locale));
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
     * Loads tokens for specified view
     *
     * @param string $viewName
     */
    public static function loadViewTokens(string $viewName)
    {
        $locale = self::getUserLocale();
        if (!self::isViewTokensExists($viewName, $locale)) {
            return;
        }

        $viewTokens = JSON::fromFile(self::getViewFileName($viewName, $locale), true);
        static::$tokens = array_merge(static::$tokens, $viewTokens);
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
