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
<title>jezve Money - Income</title>
<?php
	getStyle($sitetheme);
?>
<script type="text/javascript" src="./js/common.js"></script>
<script>
<?php
	$query = "SELECT currency.id AS curr_id, currency.sign AS sign FROM accounts, currency WHERE accounts.user_id='".$userid."' AND currency.id=accounts.curr_id;";
	$result = mysql_query($query, $dbcnx);
	$accounts = ((mysql_errno()) ? 0 : mysql_num_rows($result));

	echo("var accounts = ".$accounts.";\r\nvar acccur = [");

	$i = 1;
	while($row = mysql_fetch_array($result))
	{
		echo("[".$row['curr_id'].", '".$row['sign']."']".(($i < $accounts) ? ", " : "];\r\n"));
		$cursign[$i - 1] = $row['sign'];
		$i++;
	}
?>

function onSubmit(frm)
{
	var accid, amount, trdate;

	accid = ge('accid');
	amount = ge('amount');
	trdate = ge('date');
	if (!frm || !accid || !amount || !trdate)
		return false;

	if (!amount.value || !amount.value.length || !isNum(fixFloat(amount.value)))
	{
		alert('Please input correct amount.');
		return false;
	}

	amount.value = fixFloat(amount.value);

	if (!checkDate(trdate.value))
	{
		alert('Please input correct date.');
		return false;
	}

	frm.submit();

	return true;
}


function onChangeAcc()
{
	var accid, amountsign;

	accid = ge('accid');
	amountsign = ge('amountsign');
	if (!accid || !amountsign)
		return false;

	amountsign.innerHTML = acccur[accid.selectedIndex][1];
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
	<span><a href="./expense.php">Spend</a></span><span><b>Income</b></span><span><a href="./transfer.php">Transfer</a></span>
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
		echo("\t\t<tr><td><span>You have no one account. Please create one.</span></td></tr>\r\n");
	}
	else
	{
		echo("\t\t<tr><td>Name</td><td>Currency</td><td>Balance</td></tr>\r\n");

		while($row = mysql_fetch_array($result))
		{
			$arr = selectQuery('*', 'currency', 'id='.$row['curr_id']);
			$currname = ($arr ? $arr['name'] : '');
			$balfmt = currFormat(($arr ? $arr['format'] : ''), $row['balance']);

			if ($currname != '' && !$totalArr[$row['curr_id']])
				$totalArr[$row['curr_id']] = 0;

			$totalArr[$row['curr_id']] += $row['balance'];

			echo("\t\t<tr><td>".$row['name']."</td><td>".$currname."</td><td>".$balfmt."</td></tr>\r\n");
		}

		foreach($totalArr as $key => $value)
		{
			$arr = selectQuery('*', 'currency', 'id='.$key);
			if ($arr)
			{
				$valfmt = currFormat($arr['format'], $value);
				echo("\t\t<tr><td>Total</td><td>".$arr['name']."</td><td>".$valfmt."</td></tr>\r\n");
			}
		}
?>
	</table>
	</td>
	</tr>

	<tr>
	<td>
	<form id="incomefrm" name="incomefrm" method="post" action="./modules/income.php" onsubmit="return onSubmit(this);">
	<table>
		<tr>
		<td align="right"><span style="margin-right: 5px;">Account name</span></td>
		<td>
			<select class="inp" id="accid" name="accid" onchange="onChangeAcc();">
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
		<td align="right"><span style="margin-right: 5px;">Incoming amount</span></td>
		<td><input class="inp" id="amount" name="amount" onkeypress="return onFieldKey(event, this);"><span id="amountsign" style="margin-left: 5px;"><?php echo($cursign[0]); ?></span></td>
		</tr>

		<tr>
		<td align="right"><span style="margin-right: 5px;">Date</span></td>
		<td><input class="inp" id="date" name="date" value="<?php echo(date("d.m.Y")); ?>"></td>
		</tr>

		<tr>
		<td align="right"><span style="margin-right: 5px;">Comment</span></td>
		<td><input class="inp" id="comm" name="comm"></td>
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
