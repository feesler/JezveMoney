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
	echo(getJS("common.js"));
	echo(getJS("transaction.js"));

	echo("<script>\r\n");

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
	echo("</script>\r\n");
?>
</head>
<body>
<table class="maintable">
<?php
	echo("\t<tr><td><h1 class=\"maintitle\">".$titleString."</h1></td></tr>\r\n");

	require_once("./templates/userblock.php");
	require_once("./templates/mainmenu.php");
	require_once("./templates/submenu.php");

	echo($acc->getTable(TRUE));

	echo("\r\n");

	$accounts = $acc->getCount();
	if ($accounts > 0)
	{

	echo("\t<tr>\r\n");
	echo("\t<td>\r\n");
	echo("\t<form method=\"post\" action=\"./modules/transaction.php?type=".$type_str."\" onsubmit=\"return ".(($trans_type == 3) ? "onTransferSubmit" : "onSubmit")."(this);\">\r\n");
	echo("\t<table>\r\n");

	if ($trans_type == 1 || $trans_type == 3)
	{
		echo("\t\t<tr>\r\n");
		echo("\t\t<td class=\"lblcell\"><span>".$srcLbl."</span></td>\r\n");
		echo("\t\t<td>\r\n");
		echo("\t\t\t<select id=\"srcid\" name=\"srcid\" onchange=\"".(($trans_type == 3) ? "onChangeSource" : "onChangeAcc")."();\">\r\n");
		echo($acc->getList($src_id));
		echo("\t\t\t</select>\r\n");
		echo("\t\t</td>\r\n");
		echo("\t\t</tr>\r\n\r\n");
	}

	if ($trans_type == 2 || $trans_type == 3)
	{
		echo("\t\t<tr>\r\n");
		echo("\t\t<td class=\"lblcell\"><span>".$destLbl."</span></td>\r\n");
		echo("\t\t<td>\r\n");
		echo("\t\t\t<select id=\"destid\" name=\"destid\" onchange=\"".(($trans_type == 3) ? "onChangeDest" : "onChangeAcc")."();\">\r\n");
		echo($acc->getList($dest_id));
		echo("\t\t\t</select>\r\n");
		echo("\t\t</td>\r\n");
		echo("\t\t</tr>\r\n\r\n");
	}

	echo("\t\t<tr>\r\n");
	echo("\t\t<td class=\"lblcell\"><span>".$amountLbl."</span></td>\r\n");
	echo("\t\t<td><input id=\"amount\" name=\"amount\" type=\"text\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
	echo("<span id=\"amountsign\" class=\"currsign\">".(($trans_type == 1) ? $src_sign : $dest_sign)."</span>");
	if ($trans_type != 3)
	{
		echo("<input id=\"ancurrbtn\" class=\"btn\" type=\"button\" onclick=\"showCurrList();\" value=\"currency\">\r\n");
		echo("\t\t\t<select id=\"transcurr\" name=\"transcurr\" style=\"display: none;\" onchange=\"onChangeTransCurr();\">\r\n");
		echo(Currency::getList($src_curr));
		echo("\t\t\t</select>\r\n");
	}
	echo("\t\t</td>\r\n");
	echo("\t\t</tr>\r\n\r\n");

	echo("\t\t<tr id=\"chargeoff\"");
	if ($trans_type != 3 || ($trans_type == 3 && $src_curr == $dest_curr))
		echo(" style=\"display: none;\"");
	echo(">\r\n");

	echo("\t\t<td class=\"lblcell\"><span>".$chargeLbl."</span></td>\r\n");
	echo("\t\t<td><input id=\"charge\" name=\"charge\" type=\"text\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\"><span id=\"chargesign\" class=\"currsign\">".$src_sign."</span></td>\r\n");
	echo("\t\t</tr>\r\n\r\n");

	echo("\t\t<tr id=\"exchange\"");
	if ($trans_type != 3 || ($trans_type == 3 && $src_curr == $dest_curr))
		echo(" style=\"display: none;\"");
	echo(">\r\n");

	echo("\t\t<td class=\"lblcell\"><span>Exchange rate</span></td>\r\n");
	echo("\t\t<td><input id=\"exchrate\" name=\"exchrate\" type=\"text\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\" value=\"1\"><span id=\"exchcomm\" style=\"margin-left: 5px;\"></span></td>\r\n");
	echo("\t\t</tr>\r\n\r\n");

	echo("\t\t<tr>\r\n");
	echo("\t\t<td class=\"lblcell\"><span>Result balance</span></td>\r\n");
	echo("\t\t<td><input id=\"resbal\" name=\"resbal\" type=\"text\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\"></td>\r\n");
	echo("\t\t</tr>\r\n\r\n");

	echo("\t\t<tr>\r\n");
	echo("\t\t<td class=\"lblcell\"><span>Date</span></td>\r\n");
	echo("\t\t<td><input id=\"date\" name=\"date\" type=\"text\" value=\"".date("d.m.Y")."\"></td>\r\n");
	echo("\t\t</tr>\r\n\r\n");

	echo("\t\t<tr>\r\n");
	echo("\t\t<td class=\"lblcell\"><span>Comment</span></td>\r\n");
	echo("\t\t<td><input id=\"comm\" name=\"comm\" type=\"text\"></td>\r\n");
	echo("\t\t</tr>\r\n\r\n");

	echo("\t\t<tr>\r\n");
	echo("\t\t<td colspan=\"2\" style=\"text-align: center;\"><input type=\"submit\" value=\"ok\"></td>\r\n");
	echo("\t\t</tr>\r\n");
	echo("\t</table>\r\n");
	echo("\t</form>\r\n");
	echo("\t</td>\r\n");
	echo("\t</tr>\r\n");

	}
?>
</table>
</body>
</html>
