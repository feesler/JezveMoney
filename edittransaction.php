<?php
require_once("./setup.php");

function fail()
{
	setLocation("./transactions.php");
	exit();
}

session_start();

$userid = checkUser("./login.php");

if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
	fail();

$trans_id = intval($_GET["id"]);

$resArr = $db->selectQ("*", "transactions", "id=".$trans_id." AND user_id=".$userid);
if (count($resArr) != 1)
	fail();

$arr = $resArr[0];
$trans_scr_id = intval($arr["src_id"]);
$trans_dest_id = intval($arr["dest_id"]);
$trans_type = intval($arr["type"]);
$trans_curr = intval($arr["curr_id"]);
$trans_amount = floatval($arr["amount"]);
$trans_chanrge = floatval($arr["charge"]);
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>jezve Money - Edit transaction</title>
<?php
	getStyle($sitetheme);
?>
<script type="text/javascript" src="./js/common.js"></script>
<script type="text/javascript" src="./js/transaction.js"></script>
<script>
<?php
	echo(getAccountsArray($userid));

	$accCurr = getAccCurrInfo($userid);

	$transAcc_id = 0;	// main transaction account id
	$transAccCur = 0;	// currency of transaction account
	if ((($trans_type == 1 && $trans_dest_id == 0) || ($trans_type == 3 && $trans_dest_id != 0)) && $trans_scr_id != 0)
		$transAcc_id = $trans_scr_id;
	else if ($trans_type == 2 && $trans_dest_id != 0 && $trans_scr_id == 0)
		$transAcc_id = $trans_dest_id;
	$transAccCur = getCurrId($accCurr, $transAcc_id);

	echo(getCurrencyArray());

	echo("\r\n\r\nvar transaction =\r\n{\r\n");
	echo("\tsrcAcc : ".$trans_scr_id.",\r\n");
	echo("\tdestAcc : ".$trans_dest_id.",\r\n");
	echo("\tamount : ".$trans_amount.",\r\n");
	echo("\tcharge : ".$trans_chanrge.",\r\n");
	echo("\tcurr_id : ".$trans_curr.",\r\n");
	echo("\ttype : ".$trans_type."\r\n");
	echo("};\r\n");
?>


var S1;		// balance before transaction
var a;		// amount in currency of transaction
var d;		// charge off in currency of account
var e;		// exchange rate
var S2;		// balance after transaction

// Main formula
// S2 = S1 - d
// d = a * e


function f1()
{
	if (transaction.type == 1 || transaction.type == 3)		// spend or transfer
		S2 = S1 + transaction.charge - d;
	else if (transaction.type == 2)		// income
		S2 = S1 - transaction.charge + d;
}


function f2()
{
	d = a * e;
}

function f3()
{
	if (transaction.type == 1 || transaction.type == 3)		// spend or transfer
		d = S1 + transaction.charge - S2;
	else if (transaction.type == 2)		// income
		d = S2 - S1 + transaction.charge;
}

function f4(){	a = d / e;		}
function f5(){	e = d / a;		}

function getValues()
{
	var srcid, destid, amount, charge, exchrate, resbal;

	srcid = ge('srcid');
	destid = ge('destid');
	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');
	resbal = ge('resbal');
	if ((!srcid && !destid) || !amount || !charge || !exchrate || !resbal)
		return;

	if (transaction.type == 1 || transaction.type == 3)
		S1 = parseFloat(getBalanceOfAccount(selectedValue(srcid)));
	else if (transaction.type == 2)
		S1 = parseFloat(getBalanceOfAccount(selectedValue(destid)));
	a = parseFloat(amount.value);
	d = parseFloat(charge.value);
	e = parseFloat(exchrate.value);
	S2 = parseFloat(resbal.value);
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

	chargesign.innerHTML = getCurrencySign(chargeCurr);
	amountsign.innerHTML = getCurrencySign(amountCurr);
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
	<span><b>Edit transaction</b></span>
	</td>
	</tr>
<?php
	if (isset($_GET["edit"]))
	{
		echo("<tr><td style=\"padding-left: 50px;\">");

		if ($_GET["edit"] == "ok")
			echo("<span style=\"color: #20FF20;\">Transaction updated.</span>");
		else if ($_GET["edit"] == fail)
			echo("<span style=\"color: #FF2020;\">Fail to update transaction.</span>");
		echo("</td></tr>");
	}

	echo(getAccountsTable($userid));

	$accounts = $db->countQ("accounts", "user_id=".$userid);
	if ($accounts > 0)
	{
?>

	<tr>
	<td>
	<form id="spendfrm" name="spendfrm" method="post" action="./modules/edittransaction.php" onsubmit="return onEditTransSubmit(this);">
	<input name="transid" type="hidden" value="<?php echo($arr["id"]); ?>">
	<input name="transtype" type="hidden" value="<?php echo($arr["type"]); ?>">
	<table>
<?php
	if ($trans_type == 1 || $trans_type == 3)
	{
		echo("\t\t<tr>\r\n");
		if ($trans_type == 3)
			echo("\t\t<td align=\"right\"><span style=\"margin-right: 5px;\">Source account</span></td>\r\n");
		else
			echo("\t\t<td align=\"right\"><span style=\"margin-right: 5px;\">Account name</span></td>\r\n");
		echo("\t\t<td>\r\n");
		echo("\t\t\t<select class=\"inp\" id=\"srcid\" name=\"srcid\" onchange=\"");
		if ($trans_type == 1)
			echo("onChangeAcc();");
		else
			echo("onChangeSource();");
		echo("\">\r\n");
		echo(getAccountsList($userid, intval($arr["src_id"])));
		echo("\t\t\t</select>\r\n");
		echo("\t\t</td>\r");
		echo("\t\t</tr>\r");
	}

	if ($trans_type == 2 || $trans_type == 3)
	{
		echo("\t\t<tr>\r\n");
		if ($trans_type == 3)
			echo("\t\t<td align=\"right\"><span style=\"margin-right: 5px;\">Destination account</span></td>\r\n");
		else
			echo("\t\t<td align=\"right\"><span style=\"margin-right: 5px;\">Account name</span></td>\r\n");
		echo("\t\t<td>\r\n");
		echo("\t\t\t<select class=\"inp\" id=\"destid\" name=\"destid\" onchange=\"");
		if ($trans_type == 2)
			echo("onChangeAcc();");
		else
			echo("onChangeDest();");
		echo("\">\r\n");
		echo(getAccountsList($userid, intval($arr["dest_id"])));
		echo("\t</select>\r\n");
		echo("\t\t</td>\r");
		echo("\t\t</tr>\r");
	}
?>
		<tr>
<?php
		echo("\t\t<td align=\"right\"><span style=\"margin-right: 5px;\">");
		if ($trans_type == 1)
			echo("Amount to spend");
		else if ($trans_type == 2)
			echo("Incoming amount");
		else if ($trans_type == 3)
			echo("Transfer amount");
		echo("</span></td>");
?>
		<td><input class="inp" id="amount" name="amount" onkeypress="return onFieldKey(event, this);" oninput="onFInput(this);" value="<?php echo($arr["amount"]); ?>"><span id="amountsign" style="margin-left: 5px; margin-right: 5px;"><?php echo(getSign($accCurr, $trans_curr)); ?></span>
<?php
	if ($trans_type == 1 || $trans_type == 2)
	{
		echo("<input id=\"ancurrbtn\" class=\"btn\" type=\"button\" onclick=\"showCurrList();\" value=\"currency\">\r\n");
		echo("\t\t\t<select class=\"inp\" id=\"transcurr\" name=\"transcurr\" style=\"display: none;\" onchange=\"onChangeTransCurr();\">");
		echo(getCurrencyList($trans_curr));
		echo("</select>");
	}
?>
		</td>
		</tr>

<?php
		echo("\t\t<tr id=\"chargeoff\"");
		if (($trans_type == 3 && getCurrId($accCurr, $trans_src_id) == getCurrId($accCurr, $trans_dest_id)) ||
			(($trans_type == 1 || $trans_type == 2) && $transAccCur == $trans_curr))
			echo(" style=\"display: none;\"");
		echo(">\r\n");

		echo("\t\t<td align=\"right\"><span style=\"margin-right: 5px;\">");
		if ($trans_type == 1 || $trans_type == 3)
			echo("Charge off");
		else if ($trans_type == 2)
			echo("Receipt");
		echo("</span></td>");
?>
		<td><input class="inp" id="charge" name="charge" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);" value="<?php echo($arr["charge"]); ?>"><span id="chargesign" style="margin-left: 5px;"><?php echo(getCurSign($accCurr, $transAcc_id)); ?></span></td>
		</tr>

<?php
		echo("\t\t<tr id=\"exchange\"");
		if (($trans_type == 3 && getCurrId($accCurr, $trans_src_id) == getCurrId($accCurr, $trans_dest_id)) ||
			(($trans_type == 1 || $trans_type == 2) && $transAccCur == $trans_curr))
			echo(" style=\"display: none;\"");
		echo(">\r\n");
?>
		<td style="text-align: right;"><span style="margin-right: 5px;">Exchange rate</span></td>
		<td><input class="inp" id="exchrate" name="exchrate" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);" value="<?php echo($arr["amount"] / $arr["charge"]); ?>"></td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Result balance</span></td>
		<td><input class="inp" id="resbal" name="resbal" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);"></td>
		</tr>

		<tr>
		<td align="right"><span style="margin-right: 5px;">Date</span></td>
		<td><input class="inp" id="date" name="date" value="<?php echo(date("d.m.Y", strtotime($arr["date"]))); ?>"></td>
		</tr>

		<tr>
		<td align="right"><span style="margin-right: 5px;">Comment</span></td>
		<td><input class="inp" id="comm" name="comm" value="<?php echo($arr["comment"]); ?>"></td>
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
