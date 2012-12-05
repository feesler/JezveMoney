<?php
	require_once("./setup.php");

	session_start();

	$userid = checkUser("./login.php");
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
<script type="text/javascript" src="./js/transaction.js"></script>
<script>
<?php
	echo(getAccountsArray($userid));

	$accCurr = getAccCurrInfo($userid);
	$dest_id = count($accCurr) ? $accCurr[0]["id"] : 0;

	echo(getCurrencyArray());

	echo("var trans_curr = ".$accCurr[0]["curr_id"].";\r\n");
	echo("var trans_acc_curr = ".$accCurr[0]["curr_id"].";\r\n");
	echo("var trans_type = 2;\r\n");
?>
</script>
</head>
<body>
<table class="maintable">
	<tr><td><h1 class="maintitle">jezve Money</h1></td></tr>
<?php
	require_once("./templates/userblock.php");
	require_once("./templates/mainmenu.php");
?>

	<tr>
	<td class="submenu">
	<span><a href="./expense.php">Spend</a></span><span><b>Income</b></span><span><a href="./transfer.php">Transfer</a></span>
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
	<form id="incomefrm" name="incomefrm" method="post" action="./modules/income.php" onsubmit="return onSubmit(this);">
	<table>
		<tr>
		<td align="right"><span style="margin-right: 5px;">Account name</span></td>
		<td>
			<select class="sel" id="destid" name="destid" onchange="onChangeAcc();">
<?php
	echo(getAccountsList($userid, $dest_id));
?>
			</select>
		</td>
		</tr>

		<tr>
		<td align="right"><span style="margin-right: 5px;">Incoming amount</span></td>
		<td><input class="inp" id="amount" name="amount" onkeypress="return onFieldKey(event, this);" oninput="onFInput(this);"><span id="amountsign" class="currsign"><?php echo(getCurSign($accCurr, $dest_id)); ?></span><input id="ancurrbtn" class="btn" type="button" onclick="showCurrList();" value="currency">
			<select class="sel" id="transcurr" name="transcurr" style="display: none;" onchange="onChangeTransCurr();">
<?php
	echo(getCurrencyList(getCurrId($accCurr, $dest_id)));
?>
			</select>
		</td>
		</tr>

		<tr id="chargeoff" style="display: none;">
		<td style="text-align: right;"><span style="margin-right: 5px;">Receipt</span></td>
		<td><input class="inp" id="charge" name="charge" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);"><span id="chargesign" style="margin-left: 5px;"><?php echo(getCurSign($accCurr, $dest_id)); ?></span></td>
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
