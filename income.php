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
	$query = "SELECT currency.id AS curr_id, currency.sign AS sign, accounts.balance AS balance FROM accounts, currency WHERE accounts.user_id='".$userid."' AND currency.id=accounts.curr_id;";
	$result = mysql_query($query, $dbcnx);
	$accounts = ((mysql_errno()) ? 0 : mysql_num_rows($result));

	echo("var accounts = ".$accounts.";\r\nvar acccur = [");

	$i = 1;
	while($row = mysql_fetch_array($result))
	{
		echo("[".$row['curr_id'].", '".$row['sign']."', ".$row['balance']."]".(($i < $accounts) ? ", " : "];\r\n"));
		$cursign[$i - 1] = $row['sign'];
		$i++;
	}

	$query = "SELECT id, name, sign FROM currency ORDER BY id;";
	$result = mysql_query($query, $dbcnx);
	$currcount = ((mysql_errno()) ? 0 : mysql_num_rows($result));

	echo("var currency = [");

	$i = 1;
	while($row = mysql_fetch_array($result))
	{
		echo("[".$row['id'].", '".$row['name']."', '".$row['sign']."']".(($i < $currcount) ? ", " : "];\r\n"));
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


function showCurrList()
{
	var transcurr, ancurrbtn;

	transcurr = ge('transcurr');
	ancurrbtn = ge('ancurrbtn');
	if (!transcurr || !ancurrbtn)
		return;

	transcurr.style.display = '';
	ancurrbtn.style.display = 'none';
}



var S1;		// balance before transaction
var a;		// amount in currency of transaction
var d;		// receipt in currency of account
var e;		// exchange rate
var S2;		// balance after transaction

// Main formula
// S2 = S1 - d
// d = a * e


function f1(){	S2 = S1 + d;	}
function f2(){	d = a * e;		}
function f3(){	d = S2 - S1;	}
function f4(){	a = d / e;		}
function f5(){	e = d / a;		}

function getValues()
{
	var accid, amount, receipt, exchrate, resbal;

	accid = ge('accid');
	amount = ge('amount');
	receipt = ge('receipt');
	exchrate = ge('exchrate');
	resbal = ge('resbal');
	if (!accid || !amount || !receipt || !exchrate || !resbal)
		return;

	S1 = acccur[accid.selectedIndex][2];
	a = amount.value;
	d = receipt.value;
	e = exchrate.value;
	S2 = resbal.value;
}


function setValues()
{
	var amount, receipt, exchrate, resbal;

	amount = ge('amount');
	receipt = ge('receipt');
	exchrate = ge('exchrate');
	resbal = ge('resbal');
	if (!amount || !receipt || !exchrate || !resbal)
		return;

	amount.value = a;
	receipt.value = d;
	exchrate.value = e;
	resbal.value = S2;
}



function onFInput(obj)
{
	getValues();

	if (S1 != '' && S2 != '' && d != '' && e != '' && a != '')
	{
		if (obj.id == 'receipt')		// d is changed, update S2 and e
		{
			f5();
			f1();
		}
		else if (obj.id == 'resbal')	// S2 is changed, update d and e
		{
			f3();
			f5();
		}
		else if (obj.id == 'amount' || obj.id == 'exchrate')	// a or e is changed, update S2 and d
		{
			f2();
			f1();
		}
	}
	else if (e == 1)		// account currency is the same as operation currency
	{
		d = a;
		f1();
	}
	else				// account currency is different from operation currency
	{
		if (S1 != '' && e != '' && S2 != '')
		{
			f3();
			f4();
		}
		else if (S1 != '' && e != '' && a != '')
		{
			f2();
			f1();
		}
		else if (S1 != '' && e != '' && d != '')
		{
			f1();
			f4();
		}
		else if (S1 != '' && S2 != '' && a != '')
		{
			f3();
			f5();
		}
		else if (S1 != '' && S2 != '' && d != '' && e == '' && a == '')
		{
			return;
		}
		else if (S1 != '' && a != '' && d != '')
		{
			f1();
			f5();
		}
	}

	setValues();

	return true;
}


function onChangeTransCurr()
{
	var accid, transcurr, receiptrow, exchange, exchrate, chargesign, amountsign;

	accid = ge('accid');
	transcurr = ge('transcurr');
	receiptrow = ge('receiptrow');
	exchange = ge('exchange');
	exchrate = ge('exchrate');
	chargesign = ge('chargesign');
	amountsign = ge('amountsign');
	if (!accid || !transcurr || !receiptrow || !chargesign || !amountsign)
		return;

	receiptrow.style.display = '';
	exchange.style.display = '';

	chargesign.innerHTML = acccur[accid.selectedIndex][1];
	amountsign.innerHTML = currency[transcurr.selectedIndex][2];
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
		$curAccCurr = 0;
		while($row = mysql_fetch_array($result))
		{
			echo("\t\t\t\t<option value=\"".$row['id']."\"");
			if ($curAccCurr == 0)
				echo(" selected");
			echo(">".$row['name']."</option>\r\n");

			if ($curAccCurr == 0)
				$curAccCurr = $row['curr_id'];
		}
	}
?>
			</select>
		</td>
		</tr>

		<tr>
		<td align="right"><span style="margin-right: 5px;">Incoming amount</span></td>
		<td><input class="inp" id="amount" name="amount" onkeypress="return onFieldKey(event, this);" oninput="onFInput(this);"><span id="amountsign" style="margin-left: 5px; margin-right: 5px;"><?php echo($cursign[0]); ?></span><input id="ancurrbtn" class="btn" type="button" onclick="showCurrList();" value="currency">
			<select class="inp" id="transcurr" name="transcurr" style="display: none;" onchange="onChangeTransCurr();">
<?php
	$query = "SELECT * FROM `currency`;";
	$result = mysql_query($query, $dbcnx);
	if(!mysql_errno() && mysql_num_rows($result) > 0)
	{
		while($row = mysql_fetch_array($result))
		{
			echo("\t\t\t<option value=\"".$row['id']."\"");

			if ($row['id'] == $curAccCurr)
				echo(" selected");

			echo(">".$row['name']."</option>\r\n");
		}
	}
?>
			</select>
		</td>
		</tr>

		<tr id="receiptrow" style="display: none;">
		<td style="text-align: right;"><span style="margin-right: 5px;">Receipt</span></td>
		<td><input class="inp" id="receipt" name="receipt" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);"><span id="chargesign" style="margin-left: 5px;"><?php echo($cursign[1]); ?></span></td>
		</tr>

		<tr id="exchange" style="display: none;">
		<td style="text-align: right;"><span style="margin-right: 5px;">Exchange rate</span></td>
		<td><input class="inp" id="exchrate" name="exchrate" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);" value="1"></td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Result balance</span></td>
		<td><input class="inp" id="resbal" name="resbal" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);"></td>
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
