<?php
	require_once("./setup.php");

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
	require_once("./templates/mainmenu.php");
?>

	<tr>
	<td class="submenu">
	<span><a href="./expense.php">Spend</a></span><span><a href="./income.php">Income</a></span><span><a href="./transfer.php">Transfer</a></span>
	</td>
	</tr>

	<tr>
	<td>
	<table>
<?php

	$resArr = $db->selectQ("*", "accounts", "user_id=".$userid);
	$accounts = count($resArr);
/*
	$query = "SELECT * FROM `accounts` WHERE `user_id`='".$userid."';";
	$result = $db->rawQ($query, $dbcnx);
	if(!mysql_errno())
		$accounts = mysql_num_rows($result);
*/
	if (!$accounts)
	{
		echo("<tr><td><span>You have no one account. Please create one.</span></td></tr>");
	}
	else
	{
		echo("<tr><td>Name</td><td>Currency</td><td>Balance</td></tr>");

		foreach($resArr as $row)
/*
		while($row = mysql_fetch_array($result))
*/
		{
			$arr = $db->selectQ('*', 'currency', 'id='.$row['curr_id']);
			$currname = (count($arr) == 1 ? $arr[0]['name'] : '');
			$balfmt = currFormat((count($arr) == 1 ? $arr[0]['format'] : ''), $row['balance']);

			if ($currname != '' && !$totalArr[$row['curr_id']])
				$totalArr[$row['curr_id']] = 0;

			$totalArr[$row['curr_id']] += $row['balance'];

			echo("<tr><td>".$row['name']."</td><td>".$currname."</td><td>".$balfmt."</td></tr>");
		}

		foreach($totalArr as $key => $value)
		{
			$arr = $db->selectQ('*', 'currency', 'id='.$key);
			if (count($arr) == 1)
			{
				$valfmt = currFormat($arr[0]['format'], $value);
				echo("<tr><td>Total</td><td>".$arr[0]['name']."</td><td>".$valfmt."</td></tr>");
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
