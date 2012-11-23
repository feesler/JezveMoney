<?php
	require_once("./setup.php");

	session_start();

	$userid = checkUser("./login.php");
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>jezve Money - Transactions</title>
<?php
	getStyle($sitetheme);
?>
</head>
<body>
<table class="maintable">
	<tr><td style="width: 500px;"><h1 class="maintitle">jezve Money - Transactions</h1></td></tr>
<?php
	require_once("./templates/userblock.php");
	require_once("./templates/mainmenu.php");
?>
	<tr>
	<td class="submenu">
<?php
	if (isset($_GET["type"]) && ($_GET["type"] == "expense" || $_GET["type"] == "income" || $_GET["type"] == "transfer"))
		$transType = $_GET["type"];
	else
		$transType = "expense";

	if ($transType == "expense")
	{
		echo("<span>Expenses</span><span><a href=\"./transactions.php?type=income\">Income</a></span><span><a href=\"./transactions.php?type=transfer\">Transfers</a></span>");
	}
	else if ($transType == "income")
	{
		echo("<span><a href=\"./transactions.php?type=expense\">Expenses</a></span><span>Income</span><span><a href=\"./transactions.php?type=transfer\">Transfers</a></span>");
	}
	else if ($transType == "transfer")
	{
		echo("<span><a href=\"./transactions.php?type=expense\">Expenses</a></span><span><a href=\"./transactions.php?type=income\">Income</a></span><span>Transfers</span>");
	}
?>
	</td>
	</tr>

	<tr>
	<td>
	<table>
<?php

	$resArr = $db->selectQ("*", "accounts", "user_id=".$userid);
	$accounts = count($resArr);
	if (!$accounts)
	{
		echo("<tr><td><span>You have no one account. Please create one.</span></td></tr>");
	}
	else
	{
		$trtype_id = 0;
		if ($transType == "expense")
			$trtype_id = 1;
		else if ($transType == "income")
			$trtype_id = 2;
		else if ($transType == "transfer")
			$trtype_id = 3;

		$resArr = $db->selectQ("*", "transactions", "user_id=".$userid." AND type=".$trtype_id, NULL, "date ASC");
		$rowCount = count($resArr);
		if (!$rowCount)
		{
			echo("<tr><td>You have no one transaction yet.</td></tr>");
		}
		else
		{
			echo("<tr>");

			if ($transType == "expense")
				echo("<td>Source</td>");
			else if ($transType == "income")
				echo("<td>Destination</td>");
			else if ($transType == "transfer")
				echo("<td>Source</td><td>Destination</td>");

			echo("<td>Amount</td><td>Date</td><td>Comment</td></tr>");

			foreach($resArr as $row)
			{
				echo("<tr>");

				if ($transType == "expense" || $transType == "transfer")
					echo("<td>".getAccountName($row["src_id"])."</td>");
				if ($transType == "income" || $transType == "transfer")
					echo("<td>".getAccountName($row["dest_id"])."</td>");

				echo("<td style=\"text-align: right;\">".currFormat($row["amount"], $row["curr_id"]));
				if ($row["charge"] != $row["amount"])
				{
					echo(" (");

					if ($trtype_id == 1 || $trtype_id == 3)		// expense or transfer
						echo(currFormat($row["charge"], getAccountCurrency($row["src_id"])));
					else if ($trtype_id == 2)					// income
						echo(currFormat($row["charge"], getAccountCurrency($row["dest_id"])));

					echo(")");
				}
				echo("</td>");

				$fdate = date("d.m.Y", strtotime($row["date"]));

				echo("<td>".$fdate."</td>");
				echo("<td>".$row["comment"]."</td></tr>");
			}
		}
	}
?>
	</table>
	</td>
	</tr>
</table>
</body>
</html>
