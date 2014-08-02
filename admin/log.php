<?php
	$docroot = $_SERVER["DOCUMENT_ROOT"];
	$filename = $docroot."/money/admin/log.txt";

	$titleString = "jezveMoney - Log";
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title><?php echo($titleString); ?></title>
</head>
<body>
<a href="./index.php">Admin</a><br>
<a href="./currency.php">Currencies</a>  <a href="./query.php">Queries</a> <b>Logs</b>
<form method="post" action="./cleanlog.php">
<input name="clean" type="hidden" value="1">
<input type="submit" value="Clean log">
</form>
<textarea rows="50" cols="150">
<?php
	if (file_exists($filename))
	{
		$fp = fopen($filename, "r");
		if ($fp)
		{
			$contents = fread($fp, filesize($filename));
			echo($contents);
			fclose($fp);
		}
	}
?>
</textarea>
</body>
</html>