<?php
	require_once("./db.php");
	require_once("./common.php");

	session_start();

	$userid = checkUser("./login.php");
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>jezve Money</title>
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
	</td>
	</tr>

	<tr>
	<td>
	<table>
<?php
	$query = "SELECT * FROM `accounts` WHERE `user_id`='".$userid."';";
	$result = mysql_query($query, $dbcnx);
	if(!mysql_errno())
		$accounts = mysql_num_rows($result);
	if (!$accounts)
	{
		echo("<tr><td><span>You have no one account. Please create one.</span></td></tr>");
	}
	else
	{

		$query = "SELECT * FROM `transactions`;";
/*
$query = "SELECT t.id AS id, t.amount AS amount, t.charge AS charge";
$query .= " FROM `transactions` AS t, `accounts` AS a";
$query .= " WHERE a.`user_id`='".$userid."' AND `accounts`.`id`=`transactions`.src_id;";
*/
		$result = mysql_query($query, $dbcnx);
		if (!mysql_errno())
		{
			if (mysql_num_rows($result) > 0)
			{
				echo("<tr><td>id</td><td>Source</td><td>Destination</td><td>Amount</td><td>Charge</td><td>Type</td><td>Comment</td></tr>");

				while($row = mysql_fetch_array($result))
				{
					echo("<tr><td>".$row['id']."</td>");

					$arr = selectQuery('*', 'accounts', 'id='.$row['src_id']);
					if ($arr)
						echo("<td>".$arr['name']."</td>");
					else
						echo("<td></td>");

					$arr = selectQuery('*', 'accounts', 'id='.$row['dest_id']);
					if ($arr)
						echo("<td>".$arr['name']."</td>");
					else
						echo("<td></td>");

					echo("<td>".$row['amount']."</td><td>".$row['charge']."</td>");

					if ($row['type'] == 1)
						echo("<td>Spend</td>");
					else if ($row['type'] == 1)
						echo("<td>Income</td>");
					else if ($row['type'] == 2)
						echo("<td>Transfer</td>");
					else
						echo("<td></td>");

					echo("<td>".$row['comment']."</td></tr>");
				}
			}
			else
			{
				echo("<tr><td>You have no one transaction yet.</td></tr>");
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
