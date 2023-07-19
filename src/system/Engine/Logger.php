<?php

namespace JezveMoney\Core;

/**
 * Logger class
 */
class Logger
{
    private static $filename = LOGS_PATH . "log.txt";

    /**
     * Returns total count of log files
     *
     * @return string[]
     */
    protected static function getFiles()
    {
        $res = [];
        $files = glob(LOGS_PATH . "log*.txt");
        if ($files === false || count($files) === 0) {
            return $res;
        }

        foreach ($files as $fname) {
            if ($fname != "." && $fname != "..") {
                $res[] = $fname;
            }
        }

        return $res;
    }

    /**
     * Returns total count of log files
     *
     * @return int
     */
    protected static function getLogsCount()
    {
        $files = self::getFiles();
        return count($files);
    }

    /**
     * Checks size of current log file and performs rotation if needed
     *
     * @return bool
     */
    protected static function checkSize()
    {
        if (!file_exists(self::$filename)) {
            return true;
        }
        $fsize = filesize(self::$filename);
        if ($fsize < MAX_LOG_SIZE) {
            return true;
        }

        $logsCount = self::getLogsCount();
        if ($logsCount >= MAX_LOG_FILES) {
            $i = 1;
            while ($i < $logsCount) {
                if ($i == $logsCount - 1) {
                    $oldName = self::$filename;
                } else {
                    $oldName = LOGS_PATH . "log_" . ($i + 1) . ".txt";
                }
                $newName = LOGS_PATH . "log_" . ($i) . ".txt";

                if (!rename($oldName, $newName)) {
                    return false;
                }

                $i++;
            }
        } else {
            $newName = LOGS_PATH . "log_" . ($logsCount) . ".txt";
            if (!rename(self::$filename, $newName)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Writes string to log file
     *
     * @param mixed $args
     */
    public static function write(mixed ...$args)
    {
        if (file_exists(self::$filename) && !is_writable(self::$filename)) {
            return;
        }
        if (!self::checkSize()) {
            return;
        }

        $strings = [];
        foreach ($args as $argument) {
            $strArg = is_string($argument) ? $argument : var_export($argument, true);
            $strings[] = $strArg;
        }

        file_put_contents(self::$filename, implode("", $strings) . "\r\n", FILE_APPEND);
    }

    /**
     * Returns content of current log file
     *
     * @return string
     */
    public static function read()
    {
        if (!file_exists(self::$filename) || !is_readable(self::$filename)) {
            return "";
        }

        return file_get_contents(self::$filename);
    }

    /**
     * Cleans current log file
     */
    public static function clean()
    {
        $files = self::getFiles();
        foreach ($files as $filename) {
            if (file_exists($filename) && is_writable($filename)) {
                unlink($filename);
            }
        }
    }
}
