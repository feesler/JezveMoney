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

	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");
	html("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
	html("<title>".$titleString."</title>");

	getStyle($sitetheme);
	html(getJS("common.js"));
	html(getJS("transaction.js"));

	html("<script>");

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
		html("var trans_curr = ".(($trans_type == 1) ? $src_curr : $dest_curr).";");
		html("var trans_acc_curr = ".(($trans_type == 1) ? $src_curr : $dest_curr).";");
	}
	html("var trans_type = ".$trans_type.";");
	html("var edit_mode = false;");
	html("</script>");

	setTab(0);

	html("</head>");
	html("<body>");
	html("<table class=\"maintable\">");

	setTab(1);

	html("<tr><td><h1 class=\"maintitle\">".$titleString."</h1></td></tr>");

	require_once("./templates/userblock.php");
	require_once("./templates/mainmenu.php");
	require_once("./templates/submenu.php");

	echo($acc->getTable(TRUE));

	html();

	$accounts = $acc->getCount();
	if ($accounts > 0)
	{
		setTab(1);

		html("<tr>");
		html("<td>");
		html("<form method=\"post\" action=\"./modules/transaction.php?type=".$type_str."\" onsubmit=\"return ".(($trans_type == 3) ? "onTransferSubmit" : "onSubmit")."(this);\">");
		html("<table>");

		setTab(2);

		if ($trans_type == 1 || $trans_type == 3)
		{
			html("<tr>");
			html("<td class=\"lblcell\"><span>".$srcLbl."</span></td>");
			html("<td>");

			setTab(3);
			html("<select id=\"srcid\" name=\"srcid\" onchange=\"".(($trans_type == 3) ? "onChangeSource" : "onChangeAcc")."();\">");
			echo($acc->getList($src_id));
			html("</select>");
			setTab(2);

			html("</td>");
			html("</tr>");
			html();
		}

		if ($trans_type == 2 || $trans_type == 3)
		{
			html("<tr>");
			html("<td class=\"lblcell\"><span>".$destLbl."</span></td>");
			html("<td>");
			setTab(3);
			html("<select id=\"destid\" name=\"destid\" onchange=\"".(($trans_type == 3) ? "onChangeDest" : "onChangeAcc")."();\">");
			echo($acc->getList($dest_id));
			html("</select>");
			setTab(2);
			html("</td>");
			html("</tr>");
			html();
		}

		html("<tr>");
		html("<td class=\"lblcell\"><span>".$amountLbl."</span></td>");
		echo($tabStr."<td><input id=\"amount\" name=\"amount\" type=\"text\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
		echo("<span id=\"amountsign\" class=\"currsign\">".(($trans_type == 1) ? $src_sign : $dest_sign)."</span>");
		if ($trans_type != 3)
		{
			echo("<input id=\"ancurrbtn\" class=\"btn\" type=\"button\" onclick=\"showCurrList();\" value=\"currency\">");
			html();
			setTab(3);
			html("<select id=\"transcurr\" name=\"transcurr\" style=\"display: none;\" onchange=\"onChangeTransCurr();\">");
			echo(Currency::getList($src_curr));
			html("</select>");
			setTab(2);
		}
		html("</td>");
		html("</tr>");
		html();

		$disp = (($trans_type != 3 || ($trans_type == 3 && $src_curr == $dest_curr)) ? " style=\"display: none;\"" : "");
		html("<tr id=\"chargeoff\"".$disp.">");
		html("<td class=\"lblcell\"><span>".$chargeLbl."</span></td>");
		html("<td><input id=\"charge\" name=\"charge\" type=\"text\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\"><span id=\"chargesign\" class=\"currsign\">".$src_sign."</span></td>");
		html("</tr>");
		html();

		$disp = (($trans_type != 3 || ($trans_type == 3 && $src_curr == $dest_curr)) ? " style=\"display: none;\"" : "");
		html("<tr id=\"exchange\"".$disp.">");
		html("<td class=\"lblcell\"><span>Exchange rate</span></td>");
		html("<td><input id=\"exchrate\" name=\"exchrate\" type=\"text\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\" value=\"1\"><span id=\"exchcomm\" style=\"margin-left: 5px;\"></span></td>");
		html("</tr>");
		html();

		html("<tr>");
		html("<td class=\"lblcell\"><span>Result balance</span></td>");
		html("<td><input id=\"resbal\" name=\"resbal\" type=\"text\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\"></td>");
		html("</tr>");
		html();

		html("<tr>");
		html("<td class=\"lblcell\"><span>Date</span></td>");
		html("<td><input id=\"date\" name=\"date\" type=\"text\" value=\"".date("d.m.Y")."\"><input id=\"yestbtn\" style=\"margin-left: 5px;\" type=\"button\" onclick=\"setYesterday();\" value=\"yesterday\"></td>");
		html("</tr>");
		html();

		html("<tr>");
		html("<td class=\"lblcell\"><span>Comment</span></td>");
		html("<td><input id=\"comm\" name=\"comm\" type=\"text\"></td>");
		html("</tr>");
		html();

		html("<tr>");
		html("<td colspan=\"2\" style=\"text-align: center;\"><input type=\"submit\" value=\"ok\"></td>");
		html("</tr>");
		setTab(1);

		html("</table>");
		html("</form>");
		html("</td>");
		html("</tr>");

		setTab(0);
	}

	html("</table>");
	html("</body>");
	html("</html>");
?>