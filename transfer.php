<?php
	require_once("./setup.php");

	session_start();

	$userid = checkUser("./login.php");
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
<script type="text/javascript" src="./js/transaction.js"></script>
<script>
<?php
	echo(getAccountsArray($userid));

	$accCurr = getAccCurrInfo($userid);
	$src_id = (count($accCurr) > 0) ? $accCurr[0]["id"] : 0;
	$dest_id = (count($accCurr) > 1) ? $accCurr[1]["id"] : 0;

	echo(getCurrencyArray());
?>

var S1;		// balance before transaction
var a;		// amount in currency of transaction
var d;		// charge off in currency of account
var e;		// exchange rate
var S2;		// balance after transaction

// Main formula
// S2 = S1 - d
// d = a * e


function f1(){	S2 = S1 - d;	}
function f2(){	d = a * e;		}
function f3(){	d = S1 - S2;	}
function f4(){	a = d / e;		}
function f5(){	e = d / a;		}

function getValues()
{
	var srcid, amount, charge, exchrate, resbal;

	srcid = ge('srcid');
	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');
	resbal = ge('resbal');
	if (!srcid || !amount || !charge || !exchrate || !resbal)
		return;

	S1 = getBalanceOfAccount(selectedValue(srcid));
	a = amount.value;
	d = charge.value;
	e = exchrate.value;
	S2 = resbal.value;
}


function setValues()
{
	var amount, charge, exchrate, resbal;

	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');
	resbal = ge('resbal');
	if (!amount || !charge || !exchrate || !resbal)
		return;

	amount.value = a;
	charge.value = d;
	exchrate.value = e;
	resbal.value = S2;
}



function onFInput(obj)
{
	var s1valid, s2valid, dvalid, evalid, avalid;

	getValues();

	s1valid = (S1 !== '');
	s2valid = (S2 !== '');
	dvalid = (d !== '');
	evalid = (e !== '');
	avalid = (a !== '');


	if (s1valid && s2valid && dvalid && evalid && avalid)
	{
		if (obj.id == 'charge')		// d is changed, update S2 and e
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
		if (s1valid && evalid && s2valid)
		{
			f3();
			f4();
		}
		else if (s1valid && evalid && avalid)
		{
			f2();
			f1();
		}
		else if (s1valid && evalid && dvalid)
		{
			f1();
			f4();
		}
		else if (s1valid && s2valid && avalid)
		{
			f3();
			f5();
		}
		else if (s1valid && s2valid && dvalid && !evalid && !avalid)
		{
			return;
		}
		else if (s1valid && avalid && dvalid)
		{
			f1();
			f5();
		}
	}

	setValues();

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

<?php
	echo(getAccountsTable($userid, TRUE));

	$accounts = $db->countQ("accounts", "user_id=".$userid);
	if ($accounts > 0)
	{
?>

	<tr>
	<td>
	<form id="tranfrm" name="tranfrm" method="post" action="./modules/transfer.php" onsubmit="return onTransferSubmit(this);">
	<table>
		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Source account</span></td>
		<td>
			<select class="inp" id="srcid" name="srcid" onchange="onChangeSource();">
<?php
	echo(getAccountsList($userid, $src_id));
?>
			</select>
		</td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Destination account</span></td>
		<td>
			<select class="inp" id="destid" name="destid" onchange="onChangeDest();">
<?php
	echo(getAccountsList($userid, $dest_id));
?>
			</select>
		</td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Transfer amount</span></td>
		<td><input class="inp" id="amount" name="amount" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);"><span id="amountsign" style="margin-left: 5px;"><?php echo(getCurSign($accCurr, $src_id)); ?></span></td>
		</tr>

<?php
		echo("\t\t<tr id=\"chargeoff\"");
		if (getCurrId($accCurr, $src_id) == getCurrId($accCurr, $dest_id))
			echo(" style=\"display: none;\"");
		echo(">\r\n");
?>
		<td style="text-align: right;"><span style="margin-right: 5px;">Charge off</span></td>
		<td><input class="inp" id="charge" name="charge" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);"><span id="chargesign" style="margin-left: 5px;"><?php echo(getCurSign($accCurr, $dest_id)); ?></span></td>
		</tr>

<?php
		echo("\t\t<tr id=\"exchange\"");
		if (getCurrId($accCurr, $src_id) == getCurrId($accCurr, $dest_id))
			echo(" style=\"display: none;\"");
		echo(">\r\n");
?>
		<td style="text-align: right;"><span style="margin-right: 5px;">Exchange rate</span></td>
		<td><input class="inp" id="exchrate" name="exchrate" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);"></td>
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
