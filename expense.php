<?php
require_once("./db.php");
require_once("./common.php");

session_start();

if (isset($_SESSION["userid"]))
{
	$userid = intval($_SESSION["userid"]);
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
<title>jezve Money - Spend</title>
<?php
	getStyle($sitetheme);
?>
<script type="text/javascript" src="./js/common.js"></script>
<script>
function onSubmit()
{
	var spendfrm, accid, amount;

	spendfrm = ge('spendfrm');
	accid = ge('acc_id');
	amount = ge('amount');
	if (!spendfrm || !accid || !amount)
		return false;

	if (!amount.value || !amount.value.length || !isNum(amount.value))
	{
		alert('Please input correct amount.');
		return false;
	}

	spendfrm.action = './modules/spend.php';
	spendfrm.submit();

	return true;
}
</script>
</head>
<body>
<table class="maintable">
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
	<td class="mainmenu">
	<span><b>Main</b></span>
	<span><a href="./manage.php">Manage</a></span>
	</td>
	</tr>

	<tr>
	<td class="submenu">
	<span><b>Spend</b></span><span><a href="./income.php">Income</a></span>
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
?>

	<tr>
	<td>
	<form id="spendfrm" name="spendfrm" mathod="post" action="" onsubmit="return onSubmit()">
	<table>
		<tr>
		<td align="right"><span style="margin-right: 5px;">Account name</span></td>
		<td>
			<select class="inp" id="acc_id" name="acc_id">
<?php
	$query = "SELECT * FROM `accounts` WHERE user_id='".$userid."';";
	$result = mysql_query($query, $dbcnx);
	if(!mysql_errno() && mysql_num_rows($result) > 0)
	{
		while($row = mysql_fetch_array($result))
		{
			echo("\t\t\t\t<option value=\"".$row['id']."\">".$row['name']."</option>\r\n");
		}
	}
?>
			</select>
		</td>
		</tr>

		<tr>
		<td align="right"><span style="margin-right: 5px;">Amount to spend</span></td>
		<td><input class="inp" id="amount" name="amount"></td>
		</tr>

		<tr>
		<td colspan="2" align="center"><input class="btn" type="submit" value="ok"></td>
		</tr>
	</table>
	</form>
	</td>
	</tr>

<?php
	}
?>
	</table>
	</td>
	</tr>
</table>
</body>
</html>
