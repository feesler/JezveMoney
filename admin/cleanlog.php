<?php
	$noLogs = TRUE;
	require_once("../system/setup.php");

	$logfname = $approot."admin/log.txt";

	if (isset($_POST["clean"]) && $_POST["clean"] == "1")
	{
		if (file_exists($logfname))
			unlink($logfname);
	}


	header("Location: ./log.php");
