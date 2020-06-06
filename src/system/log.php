<?php

class Logger
{
	private static $filename = LOGS_PATH."log.txt";


	// Write string to log file
	public static function write($str)
	{
		if (!is_writable(self::$filename))
			return;

		if (is_null($str))
			$str = "";

		file_put_contents(self::$filename, $str."\r\n", FILE_APPEND);
	}


	public static function read()
	{
		if (!file_exists(self::$filename) || !is_readable(self::$filename))
			return "";

		return file_get_contents(self::$filename);
	}


	// Clean log file
	public static function clean()
	{
		if (!file_exists(self::$filename) || !is_writable(self::$filename))
			return;

		file_put_contents(self::$filename, "");
	}

}


function wlog($str = NULL)
{
	global $noLogs;

	if (isset($noLogs) && $noLogs == TRUE)
		return;

	Logger::write($str);
}


function clog()
{
	Logger::clean();
}
