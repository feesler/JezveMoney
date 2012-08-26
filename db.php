<?php

//Class DB
//{
	//function setup()
	//{
		$dblocation = "localhost";
		$dbname = "feesler";
		$dbuser = "feesler";
		$dbpasswd = "liXhcEIMEe";

		$dbcnx = @mysql_connect($dblocation, $dbuser, $dbpasswd);
		if (!$dbcnx)
		{
			//echo("<p>В настоящий момент сервер базы данных не доступен</p>");
			exit();
		}

		if (!@mysql_select_db($dbname, $dbcnx))
		{
			//echo("<p>В настоящий момент сервер базы данных не доступен</p>");
			exit();
		}
		mysql_query("SET NAMES 'utf8'");
		date_default_timezone_set('Europe/Moscow');

		$sitetheme = 1;
	//}


	function selectQuery($select, $from, $where)
	{
		global $dbcnx;

		$query = "SELECT ".$select." FROM ".$from." WHERE ".$where.";";
		$result = mysql_query($query, $dbcnx);
		if (!mysql_errno() && mysql_num_rows($result) > 0)
		{
			$row = mysql_fetch_array($result);
			return $row;
		}

		return NULL;
	}
//}

?>