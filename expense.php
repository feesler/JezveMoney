<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");


	$userid = User::check();
	if (!$userid)
		setLocation("./login.php");

	$titleString = "jezve Money - Spend";
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title><?php echo($titleString); ?></title>
<?php
	getStyle($sitetheme);
?>
<script type="text/javascript" src="./js/common.js"></script>
<script type="text/javascript" src="./js/transaction.js"></script>
<script>
<?php
	$acc = new Account($userid);

	echo($acc->getArray());

	$src_id = $acc->getIdByPos(0);
	$src_curr = $acc->getCurrency($src_id);
	$src_sign = Currency::getSign($src_curr);

	echo(Currency::getArray());
	echo("var trans_curr = ".$src_curr.";\r\n");
	echo("var trans_acc_curr = ".$src_curr.";\r\n");
	echo("var trans_type = 1;\r\n");
	echo("var edit_mode = false;\r\n");
?>
</script>
</head>
<body>
<table class="maintable">
	<tr><td><h1 class="maintitle"><?php echo($titleString); ?></h1></td></tr>
<?php
	require_once("./templates/userblock.php");
	require_once("./templates/mainmenu.php");
	require_once("./templates/submenu.php");

	echo($acc->getTable(TRUE));

	$accounts = $acc->getCount();
	if ($accounts > 0)
	{
?>

	<tr>
	<td>
	<form id="spendfrm" name="spendfrm" method="post" action="./modules/transaction.php?type=expense" onsubmit="return onSubmit(this);">
	<table>
		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Account name</span></td>
		<td>
			<select class="sel" id="srcid" name="srcid" onchange="onChangeAcc();">
<?php
	echo($acc->getList($src_id));
?>
			</select>
		</td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Amount to spend</span></td>
		<td><input id="amount" name="amount" type="text" onkeypress="return onFieldKey(event, this);" oninput="onFInput(this);"><span id="amountsign" class="currsign"><?php echo($src_sign); ?></span><input id="ancurrbtn" class="btn" type="button" onclick="showCurrList();" value="currency">
			<select class="sel" id="transcurr" name="transcurr" style="display: none;" onchange="onChangeTransCurr();">
<?php
	echo(Currency::getList($src_curr));
?>
			</select>
		</td>
		</tr>

		<tr id="chargeoff" style="display: none;">
		<td style="text-align: right;"><span style="margin-right: 5px;">Charge off</span></td>
		<td><input id="charge" name="charge" type="text" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);"><span id="chargesign" style="margin-left: 5px;"><?php echo($src_sign); ?></span></td>
		</tr>

		<tr id="exchange" style="display: none;">
		<td style="text-align: right;"><span style="margin-right: 5px;">Exchange rate</span></td>
		<td><input id="exchrate" name="exchrate" type="text" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);" value="1"><span id="exchcomm" style="margin-left: 5px;"></span></td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Result balance</span></td>
		<td><input id="resbal" name="resbal" type="text" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);"></td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Date</span></td>
		<td><input id="date" name="date" type="text" value="<?php echo(date("d.m.Y")); ?>"></td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Comment</span></td>
		<td><input id="comm" name="comm" type="text"></td>
		</tr>

		<tr>
		<td colspan="2" style="text-align: center;"><input type="submit" value="ok"></td>
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
