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
	$query = "SELECT * FROM `accounts` WHERE `user_id`='".$userid."';";
	$result = $db->rawQ($query, $dbcnx);
	if(!mysql_errno())
		$accounts = mysql_num_rows($result);
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

		$resArr = $db->selectQ("*", "transactions AS t", "t.user_id=".$userid." AND t.type=".$trtype_id);
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

			echo("<td>Amount</td><td>Comment</td></tr>");

			foreach($resArr as $row)
			{
				echo("<tr>");

				if ($transType == "expense" || $transType == "transfer")
				{
					$arr = $db->selectQ('*', 'accounts', 'id='.$row['src_id']);

					if (count($arr) == 1)
						echo("<td>".$arr[0]['name']."</td>");
					else
						echo("<td></td>");
				}

				if ($transType == "income" || $transType == "transfer")
				{
					$arr = $db->selectQ('*', 'accounts', 'id='.$row['dest_id']);

					if (count($arr) == 1)
						echo("<td>".$arr[0]['name']."</td>");
					else
						echo("<td></td>");
				}

				echo("<td>".$row['amount']);
				if ($row["charge"] != $row["amount"])
				{
					$arr = $db->selectQ('*', '`accounts` AS a, `currency` AS c', 'a.id='.$row["dest_id"].' AND c.id=a.curr_id');

					$chargefmt = currFormat(((count($arr) == 1) ? $arr["format"] : ''), $row["charge"]);

					echo(" (".$chargefmt.")");
				}
				echo("</td>");

				echo("<td>".$row['comment']."</td></tr>");
			}
		}

/*
		$query = "SELECT * FROM `transactions` AS t WHERE t.user_id='".$userid."' AND t.type=";
		if ($transType == "expense")
			$query .= "1";
		else if ($transType == "income")
			$query .= "2";
		else if ($transType == "transfer")
			$query .= "3";
		$query .= ";";

		$result = $db->rawQ($query, $dbcnx);
		if (!mysql_errno())
		{
			if (mysql_num_rows($result) > 0)
			{
				echo("<tr>");

				if ($transType == "expense")
					echo("<td>Source</td>");
				else if ($transType == "income")
					echo("<td>Destination</td>");
				else if ($transType == "transfer")
					echo("<td>Source</td><td>Destination</td>");

				echo("<td>Amount</td><td>Comment</td></tr>");

				while($row = mysql_fetch_array($result))
				{
					echo("<tr>");

					if ($transType == "expense" || $transType == "transfer")
					{
						$arr = $db->selectQ('*', 'accounts', 'id='.$row['src_id']);

						if (count($arr) == 1)
							echo("<td>".$arr[0]['name']."</td>");
						else
							echo("<td></td>");
					}

					if ($transType == "income" || $transType == "transfer")
					{
						$arr = $db->selectQ('*', 'accounts', 'id='.$row['dest_id']);

						if (count($arr) == 1)
							echo("<td>".$arr[0]['name']."</td>");
						else
							echo("<td></td>");
					}

					echo("<td>".$row['amount']);
					if ($row["charge"] != $row["amount"])
					{
						$arr = $db->selectQ('*', '`accounts` AS a, `currency` AS c', 'a.id='.$row["dest_id"].' AND c.id=a.curr_id');

						$chargefmt = currFormat(((count($arr) == 1) ? $arr["format"] : ''), $row["charge"]);

						echo(" (".$chargefmt.")");
					}
					echo("</td>");

					echo("<td>".$row['comment']."</td></tr>");
				}
			}
			else
			{
				echo("<tr><td>You have no one transaction yet.</td></tr>");
			}
		}
*/
	}
?>
	</table>
	</td>
	</tr>
</table>
</body>
</html>
