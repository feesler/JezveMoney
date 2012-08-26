<?php
require_once("./db.php");

session_start();

if (isset($_SESSION["userid"]))
{
	$userid = $_SESSION["userid"];
}
else
{
	header("Location: ./login.php");
	exit();
}
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>jezve Money</title>
<link rel="stylesheet" type="text/css" href="./css/common.css">
<?php
echo("<link rel=\"stylesheet\" type=\"text/css\" href=\"");
if ($sitetheme == 1)
	echo("./css/white.css");
else
	echo("./css/black.css");
echo("\">\r\n");
?>
</head>
<body>
<table align="center" valign="center" style="width: 100%; height: 100%;">
	<tr><td style="width: 500px;"><h1 class="maintitle">jezve Money</h1></td></tr>

	<tr>
	<td style="margin-top: 15px; margin-right: 30px; width: 100%; height: 30px;" align="right">
	<form id="logoutfrm" name="logoutfrm" method="post" action="./modules/logout.php">
	<span style="margin-right: 20px;"><?php
	$query = "SELECT * FROM `users` WHERE `id`='".$userid."';";
	$result = mysql_query($query, $dbcnx);
	if(!mysql_errno() && mysql_num_rows($result) == 1)
	{
		$row = mysql_fetch_array($result);
		if ($row)
		{
			echo($row["login"]." logged in");
		}
	}
?></span><input class="btn" type="submit" value="Logout">
	</form>
	</td>
	</tr>

	<tr>
	<td style="padding-left: 50px;">
	<span style="margin-right: 25px; margin-left: 25px;">Accounts</span>
	<span style="margin-right: 25px; margin-left: 25px;"><a href="#">Transactions</a></span>
	<span style="margin-right: 25px; margin-left: 25px;"><b>Manage</b></span>
	</td>
	</tr>

	<tr>
	<td style="padding-left: 50px;">
	<span style="font-weight: bold; margin-right: 25px; margin-left: 25px;">Accounts</span>
	<span style="margin-right: 25px; margin-left: 25px;"><a href="#">Transactions</a></span>
	<span style="margin-right: 25px; margin-left: 25px;"><a href="#">Statistics</a></span>
	</td>
	</tr>

	<tr>
	<td style="padding-left: 50px;">
	<a href="./createaccount.php">Create new</a>
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
?>

	<tr>
	<td style="padding-left: 50px;">
	<table>
<?php
	function currFormat($ftmStr, $balValue)
	{
		$balance = number_format($row['balance'], 2, ',', ' ');
		$balfmt = sprintf($arr['format'], $balance);

		return $resStr;
	}

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
