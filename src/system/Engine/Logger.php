<?php

namespace JezveMoney\Core;

class Logger
{
    private static $filename = LOGS_PATH . "log.txt";


    // Return total count of log files
    protected static function getLogsCount()
    {
        $files = glob(LOGS_PATH . "log*.txt");
        if ($files === false || count($files) === 0) {
            return 0;
        }

        $res = 0;
        foreach ($files as $fname) {
            if ($fname != "." && $fname != "..") {
                $res++;
            }
        }

        return $res;
    }


    // Write string to log file
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

    // Write string to log file
    public static function write($str)
    {
        if (file_exists(self::$filename) && !is_writable(self::$filename)) {
            return;
        }
        if (!self::checkSize()) {
            return;
        }

        if (is_null($str)) {
            $str = "";
        }

        file_put_contents(self::$filename, $str . "\r\n", FILE_APPEND);
    }


    public static function read()
    {
        if (!file_exists(self::$filename) || !is_readable(self::$filename)) {
            return "";
        }

        return file_get_contents(self::$filename);
    }


    // Clean log file
    public static function clean()
    {
        if (!file_exists(self::$filename) || !is_writable(self::$filename)) {
            return;
        }

        file_put_contents(self::$filename, "");
    }
}
