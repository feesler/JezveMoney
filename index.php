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
	<tr><td style="width: 500px;"><h1 class="maintitle">jezve Money</h1></td></tr>

<?php
	require_once("./templates/userblock.php");
?>

	<tr>
	<td class="mainmenu">
	<span><b>Main</b></span>
	<span><a href="./accounts.php">Accounts</a></span>
	</td>
	</tr>

	<tr>
	<td class="submenu">
	<span><a href="./expense.php">Spend</a></span><span><a href="./income.php">Income</a></span>
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
		echo("<tr><td>Name</td><td>Currency</td><td>Balance</td></tr>");

		while($row = mysql_fetch_array($result))
		{
			$arr = selectQuery('*', 'currency', 'id='.$row['curr_id']);
			$currname = ($arr ? $arr['name'] : '');
			$balfmt = currFormat(($arr ? $arr['format'] : ''), $row['balance']);

			if ($currname != '' && !$totalArr[$row['curr_id']])
				$totalArr[$row['curr_id']] = 0;

			$totalArr[$row['curr_id']] += $row['balance'];

			echo("<tr><td>".$row['name']."</td><td>".$currname."</td><td>".$balfmt."</td></tr>");
		}

		foreach($totalArr as $key => $value)
		{
			$arr = selectQuery('*', 'currency', 'id='.$key);
			if ($arr)
			{
				$valfmt = currFormat($arr['format'], $value);
				echo("<tr><td>Total</td><td>".$arr['name']."</td><td>".$valfmt."</td></tr>");
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
