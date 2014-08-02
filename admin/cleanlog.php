<?php
	$docroot = $_SERVER["DOCUMENT_ROOT"];
	$logfname = $docroot."/money/admin/log.txt";

	if (isset($_POST["clean"]) && $_POST["clean"] == "1")
	{
		if (file_exists($logfname))
			unlink($logfname);
	}


	header("Location: ./log.php");
?>
