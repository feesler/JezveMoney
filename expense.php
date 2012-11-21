<?php
require_once("./setup.php");

session_start();

$userid = checkUser('./login.php');
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
<?php
	$resArr = $db->selectQ("c.id AS curr_id, c.sign AS sign, a.balance AS balance", "accounts AS a, currency AS c", "a.user_id='".$userid."' AND c.id=a.curr_id");
	$accounts = count($resArr);
	echo("var accounts = ".$accounts.";\r\nvar acccur = [");
	foreach($resArr as $i => $row)
	{
		echo("[".$row['curr_id'].", '".$row['sign']."', ".$row['balance']."]".(($i < $accounts - 1) ? ", " : "];\r\n"));
		$cursign[$i] = $row['sign'];
	}

	$resArr = $db->selectQ("id, name, sign", "currency", NULL, NULL, "id");
	$currcount = count($resArr);
	echo("var currency = [");
	foreach($resArr as $i => $row)
	{
		echo("[".$row['id'].", '".$row['name']."', '".$row['sign']."']".(($i < $currcount - 1) ? ", " : "];\r\n"));
		$cursign[$i] = $row['sign'];
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
	var accid, amount, charge, exchrate, resbal;

	accid = ge('accid');
	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');
	resbal = ge('resbal');
	if (!accid || !amount || !charge || !exchrate || !resbal)
		return;

	S1 = acccur[accid.selectedIndex][2];
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
	getValues();

	if (S1 != '' && S2 != '' && d != '' && e != '' && a != '')
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
	var accid, transcurr, chargeoff, exchange, exchrate, chargesign, amountsign;

	accid = ge('accid');
	transcurr = ge('transcurr');
	chargeoff = ge('chargeoff');
	exchange = ge('exchange');
	exchrate = ge('exchrate');
	chargesign = ge('chargesign');
	amountsign = ge('amountsign');
	if (!accid || !transcurr || !chargeoff || !chargesign || !amountsign)
		return;

	chargeoff.style.display = '';
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
	<span><b>Spend</b></span><span><a href="./income.php">Income</a></span><span><a href="./transfer.php">Transfer</a></span>
	</td>
	</tr>

<?php
	getAccountsTable($userid);
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
			<select class="inp" id="accid" name="accid" onchange="onChangeAcc();">
<?php
	$resArr = $db->selectQ("*", "accounts", "user_id=".$userid);
	foreach($resArr as $row)
	{
		echo("\t\t\t\t<option value=\"".$row['id']."\"");
		if ($curAccCurr == 0)
			echo(" selected");
		echo(">".$row['name']."</option>\r\n");

		if ($curAccCurr == 0)
			$curAccCurr = $row['curr_id'];
	}
?>
			</select>
		</td>
		</tr>

		<tr>
		<td align="right"><span style="margin-right: 5px;">Amount to spend</span></td>
		<td><input class="inp" id="amount" name="amount" onkeypress="return onFieldKey(event, this);" oninput="onFInput(this);"><span id="amountsign" style="margin-left: 5px; margin-right: 5px;"><?php echo($cursign[0]); ?></span><input id="ancurrbtn" class="btn" type="button" onclick="showCurrList();" value="currency">
			<select class="inp" id="transcurr" name="transcurr" style="display: none;" onchange="onChangeTransCurr();">
<?php
	$resArr = $db->selectQ("*", "currency");
	foreach($resArr as $row)
	{
		echo("\t\t\t<option value=\"".$row['id']."\"");

		if ($row['id'] == $curAccCurr)
			echo(" selected");

		echo(">".$row['name']."</option>\r\n");
	}
?>
			</select>
		</td>
		</tr>

		<tr id="chargeoff" style="display: none;">
		<td style="text-align: right;"><span style="margin-right: 5px;">Charge off</span></td>
		<td><input class="inp" id="charge" name="charge" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);"><span id="chargesign" style="margin-left: 5px;"><?php echo($cursign[1]); ?></span></td>
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
