<?php
	require_once("./setup.php");

	session_start();

	$userid = checkUser("./login.php");
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
<script type="text/javascript" src="./js/transaction.js"></script>
<script>
<?php
	echo(getAccountsArray($userid));

	$accCurr = getAccCurrInfo($userid);
	$src_id = count($accCurr) ? $accCurr[0]["id"] : 0;

	echo(getCurrencyArray());

	echo("var trans_curr = ".$accCurr[0]["curr_id"].";\r\n");
	echo("var trans_acc_curr = ".$accCurr[0]["curr_id"].";\r\n");
	echo("var trans_type = 1;\r\n");
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


/*
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


function onChangeTransCurr()
{
	var srcid, amount, transcurr, chargeoff, exchange, exchrate, charge, chargesign, amountsign;
	var amountCurr, chargeCurr;

	srcid = ge('srcid');
	amount = ge('amount');
	transcurr = ge('transcurr');
	chargeoff = ge('chargeoff');
	exchange = ge('exchange');
	exchrate = ge('exchrate');
	charge = ge('charge');
	chargesign = ge('chargesign');
	amountsign = ge('amountsign');
	if (!srcid || !amount || !transcurr || !chargeoff || !exchange || !exchrate || !charge || !chargesign || !amountsign)
		return;
	if (transcurr.selectedIndex == -1 || srcid.selectedIndex == -1)
		return

	amountCurr = selectedValue(transcurr);
	chargeCurr = getCurrencyOfAccount(selectedValue(srcid));

	if (amountCurr == chargeCurr)
	{
		chargeoff.style.display = 'none';
		exchange.style.display = 'none';
		exchrate.value = 1;
		charge.value = amount.value;

		getValues();
		f5();
		f1();
		setValues();
	}
	else
	{
		chargeoff.style.display = '';
		exchange.style.display = '';
	}

	trans_curr = amountCurr;

	chargesign.innerHTML = getCurrencySign(chargeCurr);
	amountsign.innerHTML = getCurrencySign(amountCurr);
}
*/
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
	<span><b>Spend</b></span><span><a href="./income.php">Income</a></span><span><a href="./transfer.php">Transfer</a></span>
	</td>
	</tr>

<?php
	echo(getAccountsTable($userid));

	$accounts = $db->countQ("accounts", "user_id=".$userid);
	if ($accounts > 0)
	{
?>

	<tr>
	<td>
	<form id="spendfrm" name="spendfrm" method="post" action="./modules/spend.php" onsubmit="return onSubmit(this);">
	<table>
		<tr>
		<td align="right"><span style="margin-right: 5px;">Account name</span></td>
		<td>
			<select class="inp" id="srcid" name="srcid" onchange="onChangeAcc();">
<?php
	echo(getAccountsList($userid, $src_id));
?>
			</select>
		</td>
		</tr>

		<tr>
		<td align="right"><span style="margin-right: 5px;">Amount to spend</span></td>
		<td><input class="inp" id="amount" name="amount" onkeypress="return onFieldKey(event, this);" oninput="onFInput(this);"><span id="amountsign" style="margin-left: 5px; margin-right: 5px;"><?php echo(getCurSign($accCurr, $src_id)); ?></span><input id="ancurrbtn" class="btn" type="button" onclick="showCurrList();" value="currency">
			<select class="inp" id="transcurr" name="transcurr" style="display: none;" onchange="onChangeTransCurr();">
<?php
	echo(getCurrencyList(getCurrId($accCurr, $src_id)));
?>
			</select>
		</td>
		</tr>

		<tr id="chargeoff" style="display: none;">
		<td style="text-align: right;"><span style="margin-right: 5px;">Charge off</span></td>
		<td><input class="inp" id="charge" name="charge" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);"><span id="chargesign" style="margin-left: 5px;"><?php echo(getCurSign($accCurr, $src_id)); ?></span></td>
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
</body>
</html>
