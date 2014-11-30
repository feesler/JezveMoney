<?php
	$docroot = $_SERVER["DOCUMENT_ROOT"];
	$logfname = $docroot."/money/admin/log.txt";


	// Write string to log file
	function wlog($str)
	{
		global $logfname;

		$fp = fopen($logfname, "a+");
		if ($fp)
		{
			$str .= "\r\n";

			fwrite($fp, $str);
			fclose($fp);
		}
	}
	
	
	// Clean log file
	function clog()
	{
		global $logfname;

		$fp = fopen($logfname, "w");
		if ($fp)
			fclose($fp);
	}
