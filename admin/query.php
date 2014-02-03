<?php
	require_once("../setup.php");


	$user_id = User::check();
	if (!$user_id || !User::isAdmin($user_id))
		setLocation("../login.php");

	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");
	html("<meta http-equiv=\"content-type\" content=\"text/html; charset=utf-8\">");
	html("<title>Admin panel | DB queries</title>");
	html("<script type=\"text/javascript\" src=\"../js/common.js\"></script>");
	html("<script>");
	html("</script>");
	html("</head>");
	html("<body>");
	html("<a href=\"./undex.php\">Admin</a><br>");
	html("<a href=\"./currency.php\">Currencies</a>  <b>Queries</b>");

/*
	if (isset($_GET["add"]))
	{
		if ($_GET["add"] == "ok")
			html("<span style=\"color: green;\">Currency was succussfully created</span><br>");
		else if ($_GET["add"] == "fail")
			html("<span style=\"color: red;\">Fail to create new currency</span><br>");
	}
	else 	if (isset($_GET["edit"]))
	{
		if ($_GET["edit"] == "ok")
			html("<span style=\"color: green;\">Currency was succussfully updated</span><br>");
		else if ($_GET["edit"] == "fail")
			html("<span style=\"color: red;\">Fail to update new currency</span><br>");
	}
	else 	if (isset($_GET["del"]))
	{
		if ($_GET["del"] == "ok")
			html("<span style=\"color: green;\">Currency was succussfully deleted</span><br>");
		else if ($_GET["del"] == "fail")
			html("<span style=\"color: red;\">Fail to delete new currency</span><br>");
	}
*/

	$query = "";
	if (isset($_POST["query"]))
	{
		$query = $_POST["query"];

		if (isset($_POST["qtype"]) && $_POST["qtype"] == "1")		// select query
		{
			$resArr = array();
			$result = $db->rawQ($query);
			$qerr_num = mysql_errno();
			$qerror = mysql_error();
			if ($result && !$qerr_num && mysql_num_rows($result) > 0)
			{
				while($row = mysql_fetch_array($result, MYSQL_ASSOC))
					$resArr[] = $row;

				html("<table border=\"1\">");

				// header
				$resStr = "<tr>";
				foreach($resArr[0] as $ind => $val)
				{
					$resStr .= "<th>".$ind."</th>";
				}
				$resStr .= "</tr>";
				html($resStr);

				// content
				foreach($resArr as $row)
				{
					$resStr = "<tr>";
					foreach($row as $val)
					{
						$resStr .= "<td>".$val."</td>";
					}
					$resStr .= "</tr>";
					html($resStr);
				}
				$rows = count($resArr);
				$cols = $rows ? count($row) : 0;
				html("<tr><td colspan=\"".$cols."\">Rows: ".$rows."</td></tr>");

				html("</table>");
			}
			else
			{
				html("<div style=\"color: red;\">Error: ".$qerr_num."<br>".$qerror."</div><br>");
			}
		}
	}

	html("<form method=\"post\" action=\"./query.php\">");
	html("<label>Query type</label><br>");
	html("<input name=\"qtype\" type=\"radio\" value=\"1\" checked> Select");
	html("");
	html("<label>Query</label><br>");
	html("<textarea id=\"query\" name=\"query\" rows=\"5\" cols=\"80\">".$query."</textarea><br>");
	html("<input type=\"submit\" value=\"Query\">");
	html("</form>");

	html("</body>");
	html("</html>");
	
?>