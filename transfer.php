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

	echo("var trans_type = 3;\r\n");
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
			<select class="sel" id="srcid" name="srcid" onchange="onChangeSource();">
<?php
	echo(getAccountsList($userid, $src_id));
?>
			</select>
		</td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Destination account</span></td>
		<td>
			<select class="sel" id="destid" name="destid" onchange="onChangeDest();">
<?php
	echo(getAccountsList($userid, $dest_id));
?>
			</select>
		</td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Transfer amount</span></td>
		<td><input class="inp" id="amount" name="amount" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);"><span id="amountsign" class="currsign"><?php echo(getCurSign($accCurr, $dest_id)); ?></span></td>
		</tr>

<?php
		echo("\t\t<tr id=\"chargeoff\"");
		if (getCurrId($accCurr, $src_id) == getCurrId($accCurr, $dest_id))
			echo(" style=\"display: none;\"");
		echo(">\r\n");
?>
		<td style="text-align: right;"><span style="margin-right: 5px;">Charge off</span></td>
		<td><input class="inp" id="charge" name="charge" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);"><span id="chargesign" class="currsign"><?php echo(getCurSign($accCurr, $src_id)); ?></span></td>
		</tr>

<?php
		echo("\t\t<tr id=\"exchange\"");
		if (getCurrId($accCurr, $src_id) == getCurrId($accCurr, $dest_id))
			echo(" style=\"display: none;\"");
		echo(">\r\n");
?>
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
