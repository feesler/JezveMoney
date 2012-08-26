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
<title>jezve Money - Transfer</title>
<?php
	getStyle($sitetheme);
?>
<script type="text/javascript" src="./js/common.js"></script>
<script>
function onSubmit()
{
	var tranfrm, accid, amount;

	tranfrm = ge('tranfrm');
	accid = ge('accid');
	amount = ge('amount');
	if (!tranfrm || !accid || !amount)
		return false;

	if (!amount.value || !amount.value.length || !isNum(amount.value))
	{
		alert('Please input correct amount.');
		return false;
	}

	tranfrm.action = './modules/transfer.php';
	tranfrm.submit();

	return true;
}


function onChangeSource()
{
}


function onChangeDest()
{
}
</script>
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
	<span><a href="./expense.php">Spend</a></span><span><a href="./income.php">Income</a></span><span><b>Transfer</b></span>
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
	if ($accounts < 2)
	{
		echo("<tr><td><span>You need at least two accounts to transfer.</span></td></tr>");
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
	<form id="tranfrm" name="tranfrm" method="post" action="" onsubmit="return onSubmit()">
	<table>
		<tr>
		<td align="right"><span style="margin-right: 5px;">Source account</span></td>
		<td>
			<select class="inp" id="srcid" name="srcid" onchange="onChangeSource();">
<?php
	$query = "SELECT * FROM `accounts` WHERE user_id='".$userid."';";
	$result = mysql_query($query, $dbcnx);
	if(!mysql_errno() && mysql_num_rows($result) > 0)
	{
		$i = 1;
		while($row = mysql_fetch_array($result))
		{
			echo("\t\t\t\t<option value=\"".$row['id']."\"".(($i==1)?"selected":"").">".$row['name']."</option>\r\n");
			$i++;
		}
	}
?>
			</select>
		</td>
		</tr>

		<tr>
		<td align="right"><span style="margin-right: 5px;">Destination account</span></td>
		<td>
			<select class="inp" id="destid" name="destid" onchange="onChangeDest();">
<?php
	$query = "SELECT * FROM `accounts` WHERE user_id='".$userid."';";
	$result = mysql_query($query, $dbcnx);
	if(!mysql_errno() && mysql_num_rows($result) > 0)
	{
		$i = 1;
		while($row = mysql_fetch_array($result))
		{
			echo("\t\t\t\t<option value=\"".$row['id']."\"".(($i==2)?"selected":"").">".$row['name']."</option>\r\n");
			$i++;
		}
	}
?>
			</select>
		</td>
		</tr>

		<tr>
		<td align="right"><span style="margin-right: 5px;">Transfer amount</span></td>
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
