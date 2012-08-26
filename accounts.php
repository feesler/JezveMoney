<?php
	require_once("./db.php");
	require_once("./common.php");

	session_start();

	$userid = checkUser('./login.php');
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>jezve Money - Accounts</title>
<?php
	getStyle($sitetheme);
?>
</head>
<body>
<table class="maintable">
	<tr><td style="width: 500px;"><h1 class="maintitle">jezve Money - Accounts</h1></td></tr>
<?php
	require_once("./templates/userblock.php");
	require_once("./templates/mainmenu.php");
?>

	<tr>
	<td class="submenu">
	<span><a href="./createaccount.php">Create new</a></span>
	</td>
	</tr>

<?php
	if (isset($_GET['newacc']))
	{
		echo("<tr><td style=\"padding-left: 50px;\">");

		if ($_GET['newacc'] == "ok")
			echo("<span style=\"color: #20FF20;\">Account added.</span>");
		else if ($_GET['newacc'] == fail)
			echo("<span style=\"color: #FF2020;\">Fail to add account.</span>");
		echo("</td></tr>");
	}
	else if (isset($_GET['edit']))
	{
		echo("<tr><td style=\"padding-left: 50px;\">");

		if ($_GET['edit'] == "ok")
			echo("<span style=\"color: #20FF20;\">Account data saved.</span>");
		else if ($_GET['edit'] == fail)
			echo("<span style=\"color: #FF2020;\">Fail to edit account.</span>");
		echo("</td></tr>");
	}
?>

	<tr>
	<td style="padding-left: 50px;">
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
		echo("<tr><td>Name</td><td>Currency</td><td>Balance</td><td></td></tr>");

		while($row = mysql_fetch_array($result))
		{
			$arr = selectQuery('*', 'currency', 'id='.$row['curr_id']);
			if ($arr)
			{
				$balance = number_format($row['balance'], 2, ',', ' ');
				$balfmt = sprintf($arr['format'], $balance);
				$currname = $arr['name'];
			}
			else
			{
				$balfmt = number_format($row['balance'], 2, ',', ' ');
				$currname = '';
			}

			if ($currname != '' && !$totalArr[$row['curr_id']])
				$totalArr[$row['curr_id']] = 0;

			$totalArr[$row['curr_id']] += $row['balance'];

			echo("<tr><td>".$row['name']."</td><td>".$currname."</td><td>".$balfmt."</td>");
			echo("<td><a href=\"./editaccount.php?id=".$row['id']."\">edit</a></td></tr>");
		}

		foreach($totalArr as $key => $value)
		{
			$arr = selectQuery('*', 'currency', 'id='.$key);
			if ($arr)
			{
				$val = number_format($value, 2, ',', ' ');
				$valfmt = sprintf($arr['format'], $val);

				echo("<tr><td>Total</td><td>".$arr['name']."</td><td>".$valfmt."</td><td></td></tr>");
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
