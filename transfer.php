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

function isDiffCurr()
{
	var src, dest;

	src = ge('srcid');
	dest = ge('destid');

	if (!src || !dest)
		return false;

	return (acccur[src.selectedIndex][0] != acccur[dest.selectedIndex][0]);
}


function onSubmit(frm)
{
	var amount, charge, exchrate;

	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');

	if (!frm || !amount || !charge || !exchrate)
		return false;

	if (!amount.value || !amount.value.length || !isNum(fixFloat(amount.value)))
	{
		alert('Please input correct amount.');
		return false;
	}

	if (isDiffCurr() && (!charge.value || !charge.value.length || !isNum(fixFloat(charge.value))))
	{
		alert('Please input correct charge off.');
		return false;
	}

	amount.value = fixFloat(amount.value);
	charge.value = fixFloat(charge.value);
	exchrate.value = fixFloat(exchrate.value);
	frm.submit();

	return true;
}


function updControls()
{
	var src, dest, amount, charge, exchrate, chargeoff, exchange, amountsign, chargesign, dstyle;

	src = ge('srcid');
	dest = ge('destid');
	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');
	chargeoff = ge('chargeoff');
	exchange = ge('exchange');
	chargesign = ge('chargesign');
	amountsign = ge('amountsign');

	if (!src || !dest || !amount || !charge || !exchrate || !chargeoff || !exchange || !amountsign || !chargesign)
		return;

	exchange.value = '';
	if (isDiffCurr())
	{
		dstyle = '';
		charge.value = '';
	}
	else
	{
		dstyle = 'none';
		charge.value = amount.value;
	}

	chargeoff.style.display = dstyle;
	exchange.style.display = dstyle;

	amountsign.innerHTML = acccur[src.selectedIndex][1];
	chargesign.innerHTML = acccur[dest.selectedIndex][1];
}


function onChangeSource()
{
	var src, dest;

	src = ge('srcid');
	dest = ge('destid');

	if (!src || !dest)
		return;

	if (src.selectedIndex == dest.selectedIndex)
	{
		if (dest.selectedIndex == 0)
			dest.selectedIndex = accounts - 1;
		else
			dest.selectedIndex--;
	}

	updControls();
}


function onChangeDest()
{
	var src, dest;

	src = ge('srcid');
	dest = ge('destid');
	if (!src || !dest)
		return;

	if (src.selectedIndex == dest.selectedIndex)
	{
		if (src.selectedIndex == accounts - 1)
			src.selectedIndex = 0;
		else
			src.selectedIndex++;
	}

	updControls();
}


function onInput(obj)
{
	var amount, charge, exchrate;

	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');

	if (!obj || !amount || !charge || !exchrate)
		return false;

	if (obj == amount)
	{
		if (!isDiffCurr())
		{
			charge.value = amount.value;
		}
	}
	else if (obj == charge)
	{
		if (amount.value && isNum(fixFloat(amount.value)) && charge.value && isNum(fixFloat(charge.value)))
		{
			exchrate.value = fixFloat(charge.value) / fixFloat(amount.value);
		}
	}
	else if (obj == exchrate)
	{
		if (amount.value && isNum(fixFloat(amount.value)) && exchrate.value && isNum(fixFloat(exchrate.value)))
		{
			charge.value = fixFloat(exchrate.value) * fixFloat(amount.value);
		}
	}

	return true;
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
		echo("\t\t<tr><td><span>You need at least two accounts to transfer.</span></td></tr>\r\n");
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
				$arr = selectQuery('*', 'currency', 'id='.$key);
				if ($arr)
				{
					$valfmt = currFormat($arr['format'], $value);
					echo("\t\t<tr><td>Total</td><td>".$arr['name']."</td><td>".$valfmt."</td></tr>\r\n");
				}
			}
		}
?>
	</table>
	</td>
	</tr>

	<tr>
	<td>
	<form id="tranfrm" name="tranfrm" method="post" action="./modules/transfer.php" onsubmit="return onSubmit(this);">
	<table>
		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Source account</span></td>
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
			echo("\t\t\t\t<option value=\"".$row['id']."\"".(($i==1)?" selected":"").">".$row['name']."</option>\r\n");
			$i++;
		}
	}
?>
			</select>
		</td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Destination account</span></td>
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
			echo("\t\t\t\t<option value=\"".$row['id']."\"".(($i==2)?" selected":"").">".$row['name']."</option>\r\n");
			$i++;
		}
	}
?>
			</select>
		</td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Transfer amount</span></td>
		<td><input class="inp" id="amount" name="amount" oninput="return onInput(this);" onkeypress="return onFieldKey(event, this);"><span id="amountsign" style="margin-left: 5px;"><?php echo($cursign[0]); ?></span></td>
		</tr>

		<tr id="chargeoff" style="display: none;">
		<td style="text-align: right;"><span style="margin-right: 5px;">Charge off</span></td>
		<td><input class="inp" id="charge" name="charge" oninput="return onInput(this);" onkeypress="return onFieldKey(event, this);"><span id="chargesign" style="margin-left: 5px;"><?php echo($cursign[1]); ?></span></td>
		</tr>

		<tr id="exchange" style="display: none;">
		<td style="text-align: right;"><span style="margin-right: 5px;">Exchange rate</span></td>
		<td><input class="inp" id="exchrate" name="exchrate" oninput="return onInput(this);" onkeypress="return onFieldKey(event, this);"></td>
		</tr>

		<tr>
		<td align="right"><span style="margin-right: 5px;">Comment</span></td>
		<td><input class="inp" id="comm" name="comm"></td>
		</tr>

		<tr>
		<td colspan="2" style="text-align: center;"><input class="btn" type="submit" value="ok"></td>
		</tr>
	</table>
	</form>
	</td>
	</tr>

<?php
	}
?>
</table>
</body>
</html>
