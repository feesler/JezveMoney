<?php
	$docroot = $_SERVER["DOCUMENT_ROOT"];
	$logfname = $docroot."/money/log/log.txt";

	if (isset($_POST["clean"]) && $_POST["clean"] == "1")
	{
		if (file_exists($filename))
			unlink($filename);
	}


	header("Location: ./log.php");
?>
