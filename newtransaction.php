<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");
	require_once("./class/transaction.php");


	function fail()
	{
		setLocation("./index.php");
	}


	$userid = User::check();
	if (!$userid)
		setLocation("./login.php");

	$type_str = (isset($_GET["type"])) ? $_GET["type"] : "expense";

	$trans_type = Transaction::getStringType($type_str);
	if (!$trans_type)
		fail();

	$titleString = "jezve Money";
	if ($trans_type == 1)
	{
		$titleString .= " - Spend";
		$srcLbl = "Account name";
		$amountLbl = "Amount to spend";
		$chargeLbl = "Charge off";
	}
	else if ($trans_type == 2)
	{
		$titleString .= " - Income";
		$destLbl = "Account name";
		$amountLbl = "Incoming amount";
		$chargeLbl = "Receipt";
	}
	else if ($trans_type == 3)
	{
		$titleString .= " - Transfer";
		$srcLbl = "Source account";
		$destLbl = "Destination account";
		$amountLbl = "Transfer amount";
		$chargeLbl = "Charge off";
	}
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

	if ($trans_type == 2 || $trans_type == 3)
	{
		$dest_id = $acc->getIdByPos(($trans_type == 2) ? 0 : 1);
		$dest_curr = $acc->getCurrency($dest_id);
		$dest_sign = Currency::getSign($dest_curr);
	}

	echo(Currency::getArray());
	if ($trans_type == 1 || $trans_type == 2)
	{
		echo("var trans_curr = ".(($trans_type == 1) ? $src_curr : $dest_curr).";\r\n");
		echo("var trans_acc_curr = ".(($trans_type == 1) ? $src_curr : $dest_curr).";\r\n");
	}
	echo("var trans_type = ".$trans_type.";\r\n");
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


	$subMenuArr = array(array(1, "Spend", "newtransaction.php?type=expense"),
						array(2, "Income", "newtransaction.php?type=income"),
						array(3, "Transfer", "newtransaction.php?type=transfer"));

	function showSubMenu($arr)
	{
		global $ruri;
		global $trans_type;

		if (!is_array($arr))
			return;

		foreach($arr as $trTypeArr)
		{
			echo("<span>");
			if ($trans_type == $trTypeArr[0])
				echo("<b>".$trTypeArr[1]."</b>");
			else
				echo("<a href=\"./".$trTypeArr[2]."\">".$trTypeArr[1]."</a>");
			echo("</span>");
		}
	}

?>

	<tr>
	<td class="submenu">
<?php
	showSubMenu($subMenuArr);
?>
	</td>
	</tr>

<?php

	echo($acc->getTable(TRUE));

	$accounts = $acc->getCount();
	if ($accounts > 0)
	{
?>

	<tr>
	<td>
	<form method="post" action="./modules/transaction.php?type=<?php echo($type_str); ?>" onsubmit="<?php echo(($trans_type == 3) ? "return onTransferSubmit(this);" : "return onSubmit(this);"); ?>">
	<table>
<?php
	if ($trans_type == 1 || $trans_type == 3)
	{
?>
		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;"><?php echo($srcLbl); ?></span></td>
		<td>
			<select id="srcid" name="srcid" onchange="<?php echo(($trans_type == 3) ? "onChangeSource();" : "onChangeAcc();"); ?>">
<?php
	echo($acc->getList($src_id));
?>
			</select>
		</td>
		</tr>
<?php
	}

	if ($trans_type == 2 || $trans_type == 3)
	{
?>
		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;"><?php echo($destLbl); ?></span></td>
		<td>
			<select id="destid" name="destid" onchange="<?php echo(($trans_type == 3) ? "onChangeDest();" : "onChangeAcc();"); ?>">
<?php
	echo($acc->getList($dest_id));
?>
			</select>
		</td>
		</tr>
<?php
	}
?>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;"><?php echo($amountLbl); ?></span></td>
		<td><input id="amount" name="amount" type="text" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);"><span id="amountsign" class="currsign"><?php echo(($trans_type == 1) ? $src_sign : $dest_sign); ?></span><?php
	if ($trans_type != 3)
	{
?><input id="ancurrbtn" class="btn" type="button" onclick="showCurrList();" value="currency">
			<select class="sel" id="transcurr" name="transcurr" style="display: none;" onchange="onChangeTransCurr();">
<?php
	echo(Currency::getList($src_curr));
?>
			</select>
<?php
	}
?>
		</td>
		</tr>

<?php
		echo("\t\t<tr id=\"chargeoff\"");
		if ($trans_type != 3 || ($trans_type == 3 && $src_curr == $dest_curr))
			echo(" style=\"display: none;\"");
		echo(">\r\n");
?>
		<td style="text-align: right;"><span style="margin-right: 5px;"><?php echo($chargeLbl); ?></span></td>
		<td><input id="charge" name="charge" type="text" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);"><span id="chargesign" class="currsign"><?php echo($src_sign); ?></span></td>
		</tr>

<?php
		echo("\t\t<tr id=\"exchange\"");
		if ($trans_type != 3 || ($trans_type == 3 && $src_curr == $dest_curr))
			echo(" style=\"display: none;\"");
		echo(">\r\n");
?>
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
