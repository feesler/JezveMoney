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


	$userid = User::check();
	if (!$userid)
		setLocation("./login.php");

	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
		fail();

	$trans_id = intval($_GET["id"]);

	$resArr = $db->selectQ("*", "transactions", "id=".$trans_id." AND user_id=".$userid);
	if (count($resArr) != 1)
		fail();

	$arr = $resArr[0];
	$trans_src_id = intval($arr["src_id"]);
	$trans_dest_id = intval($arr["dest_id"]);
	$trans_type = intval($arr["type"]);
	$trans_curr = intval($arr["curr_id"]);
	$trans_amount = floatval($arr["amount"]);
	$trans_chanrge = floatval($arr["charge"]);

	$titleString = "jezve Money - Edit transaction";
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title><?php echo($titleString); ?></title>
<?php
	getStyle($sitetheme);
	html(getCSS("calendar.css"));
	echo(getJS("common.js"));
	echo(getJS("transaction.js"));
	html(getJS("calendar.js"));

	echo("<script>\r\n");

	$acc = new Account($userid);

	echo($acc->getArray());

	$transAcc_id = 0;	// main transaction account id
	$transAccCur = 0;	// currency of transaction account
	if ((($trans_type == 1 && $trans_dest_id == 0) || ($trans_type == 3 && $trans_dest_id != 0)) && $trans_src_id != 0)
		$transAcc_id = $trans_src_id;
	else if ($trans_type == 2 && $trans_dest_id != 0 && $trans_src_id == 0)
		$transAcc_id = $trans_dest_id;

	$src_curr = $acc->getCurrency($trans_src_id);
	$dest_curr = $acc->getCurrency($trans_dest_id);
	$transAccCur = $acc->getCurrency($transAcc_id);

	echo(Currency::getArray());

	$amount_sign = Currency::getSign($trans_curr);
	$charge_sign = Currency::getSign($transAccCur);

	echo("\r\n\r\nvar transaction =\r\n{\r\n");
	echo("\tsrcAcc : ".$trans_src_id.",\r\n");
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

	echo("</script>\r\n");
?>
</head>
<body>
<table class="maintable">
	<tr><td><h1 class="maintitle"><?php echo($titleString); ?></h1></td></tr>
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

	setTab(1);
	html("<tr>");
	html("<td>");
	echo($acc->getTable());
	html("</td>");
	html("</tr>");

	$accounts = $acc->getCount();
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
			echo("\t\t<td class=\"lblcell\"><span>Source account</span></td>\r\n");
		else
			echo("\t\t<td class=\"lblcell\"><span>Account name</span></td>\r\n");
		echo("\t\t<td>\r\n");
		echo("\t\t\t<select id=\"srcid\" name=\"srcid\" onchange=\"");
		if ($trans_type == 1)
			echo("onChangeAcc();");
		else
			echo("onChangeSource();");
		echo("\">\r\n");
		echo($acc->getList($trans_src_id));
		echo("\t\t\t</select>\r\n");
		echo("\t\t</td>\r");
		echo("\t\t</tr>\r");
	}

	if ($trans_type == 2 || $trans_type == 3)
	{
		echo("\t\t<tr>\r\n");
		if ($trans_type == 3)
			echo("\t\t<td class=\"lblcell\"><span>Destination account</span></td>\r\n");
		else
			echo("\t\t<td class=\"lblcell\"><span>Account name</span></td>\r\n");
		echo("\t\t<td>\r\n");
		echo("\t\t\t<select id=\"destid\" name=\"destid\" onchange=\"");
		if ($trans_type == 2)
			echo("onChangeAcc();");
		else
			echo("onChangeDest();");
		echo("\">\r\n");
		echo($acc->getList($trans_dest_id));
		echo("\t</select>\r\n");
		echo("\t\t</td>\r\n");
		echo("\t\t</tr>\r\n");
	}
?>
		<tr>
<?php
		echo("\t\t<td class=\"lblcell\"><span>");
		if ($trans_type == 1)
			echo("Amount to spend");
		else if ($trans_type == 2)
			echo("Incoming amount");
		else if ($trans_type == 3)
			echo("Transfer amount");
		echo("</span></td>\r\n");
?>
		<td><input id="amount" name="amount" type="text" onkeypress="return onFieldKey(event, this);" oninput="onFInput(this);" value="<?php echo($arr["amount"]); ?>"><span id="amountsign" class="currsign"><?php echo($amount_sign); ?></span>
<?php
	if ($trans_type == 1 || $trans_type == 2)
	{
		echo("<input id=\"ancurrbtn\" type=\"button\" onclick=\"showCurrList();\" value=\"currency\">\r\n");
		echo("\t\t\t<select id=\"transcurr\" name=\"transcurr\" style=\"display: none;\" onchange=\"onChangeTransCurr();\">");
		echo(Currency::getList($trans_curr));
		echo("</select>");
	}
	else if ($trans_type == 3)
	{
		echo("<input id=\"transcurr\" name=\"transcurr\" type=\"hidden\" value=\"".$acc->getCurrency($trans_dest_id)."\">");
	}
?>
		</td>
		</tr>

<?php
		echo("\t\t<tr id=\"chargeoff\"");
		if (($trans_type == 3 && $src_curr == $dest_curr) || (($trans_type == 1 || $trans_type == 2) && $transAccCur == $trans_curr))
			echo(" style=\"display: none;\"");
		echo(">\r\n");

		echo("\t\t<td class=\"lblcell\"><span>");
		if ($trans_type == 1 || $trans_type == 3)
			echo("Charge off");
		else if ($trans_type == 2)
			echo("Receipt");
		echo("</span></td>");
?>
		<td><input id="charge" name="charge" type="text" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);" value="<?php echo($arr["charge"]); ?>"><span id="chargesign" class="currsign"><?php echo($charge_sign); ?></span></td>
		</tr>

<?php
		echo("\t\t<tr id=\"exchange\"");
		if (($trans_type == 3 && $src_curr == $dest_curr) || (($trans_type == 1 || $trans_type == 2) && $transAccCur == $trans_curr))
			echo(" style=\"display: none;\"");
		echo(">\r\n");
?>
		<td class="lblcell"><span>Exchange rate</span></td>
		<td><input id="exchrate" name="exchrate" type="text" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);" value="<?php echo($arr["amount"] / $arr["charge"]); ?>"><span id="exchcomm" style="margin-left: 5px;"><?php echo($charge_sign."/".$amount_sign." (".round($arr["charge"] / $arr["amount"], 5)." ".$amount_sign."/". $charge_sign.")"); ?></span></td>
		</tr>

		<tr>
		<td class="lblcell"><span>Result balance</span></td>
		<td><input id="resbal" name="resbal" type="text" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);"></td>
		</tr>

		<tr>
		<td class="lblcell"><span>Date</span></td>
		<td><input id="date" name="date" type="text" value="<?php echo(date("d.m.Y", strtotime($arr["date"]))); ?>"><input type="button" value="calendar" style="margin-left: 5px;" onclick="showCalendar();"><div id="calendar" class="calWrap" style="display: none;"></div></td>
		<script>buildCalendar();</script>
		</tr>

		<tr>
		<td class="lblcell"><span>Comment</span></td>
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
