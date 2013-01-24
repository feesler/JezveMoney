<?php
	$filename = "./log.txt";

	if (isset($_POST["clean"]) && $_POST["clean"] == "1")
	{
		if (file_exists($filename))
			unlink($filename);
	}


	header("Location: ./log.php");
?>
