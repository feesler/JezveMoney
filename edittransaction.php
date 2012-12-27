<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");

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
	echo("var edit_mode = true;\r\n");
	echo("var trans_curr = ".$trans_curr.";\r\n");
	echo("var trans_acc_curr = ".$trans_curr.";\r\n");
	echo("var trans_type = ".$trans_type.";\r\n");
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
			echo("\t\t<td style=\"text-align: right;\"><span style=\"margin-right: 5px;\">Source account</span></td>\r\n");
		else
			echo("\t\t<td style=\"text-align: right;\"><span style=\"margin-right: 5px;\">Account name</span></td>\r\n");
		echo("\t\t<td>\r\n");
		echo("\t\t\t<select id=\"srcid\" name=\"srcid\" onchange=\"");
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
			echo("\t\t<td style=\"text-align: right;\"><span style=\"margin-right: 5px;\">Destination account</span></td>\r\n");
		else
			echo("\t\t<td style=\"text-align: right;\"><span style=\"margin-right: 5px;\">Account name</span></td>\r\n");
		echo("\t\t<td>\r\n");
		echo("\t\t\t<select id=\"destid\" name=\"destid\" onchange=\"");
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
		echo("\t\t<td style=\"text-align: right;\"><span style=\"margin-right: 5px;\">");
		if ($trans_type == 1)
			echo("Amount to spend");
		else if ($trans_type == 2)
			echo("Incoming amount");
		else if ($trans_type == 3)
			echo("Transfer amount");
		echo("</span></td>");
?>
		<td><input id="amount" name="amount" type="text" onkeypress="return onFieldKey(event, this);" oninput="onFInput(this);" value="<?php echo($arr["amount"]); ?>"><span id="amountsign" class="currsign"><?php echo(getSign($accCurr, $trans_curr)); ?></span>
<?php
	if ($trans_type == 1 || $trans_type == 2)
	{
		echo("<input id=\"ancurrbtn\" type=\"button\" onclick=\"showCurrList();\" value=\"currency\">\r\n");
		echo("\t\t\t<select id=\"transcurr\" name=\"transcurr\" style=\"display: none;\" onchange=\"onChangeTransCurr();\">");
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

		echo("\t\t<td style=\"text-align: right;\"><span style=\"margin-right: 5px;\">");
		if ($trans_type == 1 || $trans_type == 3)
			echo("Charge off");
		else if ($trans_type == 2)
			echo("Receipt");
		echo("</span></td>");
?>
		<td><input id="charge" name="charge" type="text" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);" value="<?php echo($arr["charge"]); ?>"><span id="chargesign" class="currsign"><?php echo(getCurSign($accCurr, $transAcc_id)); ?></span></td>
		</tr>

<?php
		echo("\t\t<tr id=\"exchange\"");
		if (($trans_type == 3 && getCurrId($accCurr, $trans_src_id) == getCurrId($accCurr, $trans_dest_id)) ||
			(($trans_type == 1 || $trans_type == 2) && $transAccCur == $trans_curr))
			echo(" style=\"display: none;\"");
		echo(">\r\n");
?>
		<td style="text-align: right;"><span style="margin-right: 5px;">Exchange rate</span></td>
		<td><input id="exchrate" name="exchrate" type="text" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);" value="<?php echo($arr["amount"] / $arr["charge"]); ?>"><span id="exchcomm" style="margin-left: 5px;"><?php echo(getCurSign($accCurr, $transAcc_id)."/".getSign($accCurr, $trans_curr)." (".round($arr["charge"] / $arr["amount"], 5)." ".getSign($accCurr, $trans_curr)."/".getCurSign($accCurr, $transAcc_id).")"); ?></span></td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Result balance</span></td>
		<td><input id="resbal" name="resbal" type="text" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);"></td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Date</span></td>
		<td><input id="date" name="date" type="text" value="<?php echo(date("d.m.Y", strtotime($arr["date"]))); ?>"></td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Comment</span></td>
		<td><input id="comm" name="comm" type="text" value="<?php echo($arr["comment"]); ?>"></td>
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
