<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");
	require_once("./class/person.php");
	require_once("./class/debt.php");

	$userid = User::check();
	if (!$userid)
		setLocation("./login.php");

	$give = TRUE;


	$person = new Person($userid);

	$fperson_id = $person->getIdByPos(0);
	$fperson_name = $person->getName($fperson_id);

	$acc = new Account($userid);

	$acc_id = $acc->getIdByPos(0);
	$acc_curr = $acc->getCurrency($acc_id);
	$acc_sign = Currency::getSign($acc_curr);

	$titleString = "jezve Money - New debt";
	if ($give)
		$accLbl = "Destination account";
	else
		$accLbl = "Source account";
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title><?php echo($titleString); ?></title>
<?php
	getStyle($sitetheme);
	html(getJS("common.js"));
	html(getJS("transaction.js"));
?>
<script>
	var trans_type = 4;
	var debtType = true;	// true - give, false - take
<?php
	echo($acc->getArray());
	echo(Currency::getArray());
	html("var trans_curr = ".$acc_curr.";");
	html("var trans_acc_curr = ".$acc_curr.";");
	html("var edit_mode = false;");
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

	$debtsArr = array(array(1, "New", "newdebt.php"));

	showSubMenu($debtsArr);

	if (isset($_GET["act"]) && isset($_GET["detail"]))
	{
		echo("<tr><td style=\"padding-left: 50px;\">");
		if ($_GET["act"] == "fail" && $_GET["detail"] == "person")
			echo("<span style=\"color: #FF2020;\">Person already exist.</span>");
		echo("</td></tr>");
	}


	$debt = new Debt($userid);

	html("<tr>");
	html("<td>");
	echo($acc->getTable());
	html("</td>");
	html("</tr>");

	html();

	$accounts = $acc->getCount();
	if ($accounts > 0)
	{
		setTab(1);
		html("<tr>");
		html("<td>");
		html("<form method=\"post\" action=\"./modules/debt.php\" onsubmit=\"return onDebtSubmit(this);\">");
		html("<table>");

		setTab(2);

		html("<tr>");
		html("<td class=\"lblcell\"><span>Person name</span></td>");
		html("<td>");
		html("<input id=\"personid\" name=\"personid\" type=\"hidden\" value=\"".$fperson_id."\">");
		if (!$person->getCount())
		{
			html("<input id=\"personname\" name=\"personname\" type=\"text\" value=\"\">");
		}
		else
		{
			html("<input id=\"personname\" name=\"personname\" type=\"hidden\" value=\"".$fperson_name."\">");
			html("<select id=\"personsel\" onchange=\"onPersonSel(this);\">");
			setTab(3);
			echo($person->getList());
			setTab(2);
			html("</select>");
			html("<input id=\"personbtn\" type=\"button\" value=\"new\" onclick=\"togglePerson();\" style=\"margin-left: 5px;\">");

			html();
		}

		html("</td>");
		html("</tr>");
		html();

		html("<tr>");
		html("<td class=\"lblcell\"><span>Operation</span></td>");
		html("<td>");
		html("<input id=\"debtgive\" name=\"debtop\" type=\"radio\" value=\"1\" onchange=\"onChangeDebtOp();\" checked><span>give</span><input id=\"debttake\" name=\"debtop\" type=\"radio\" value=\"2\" onchange=\"onChangeDebtOp();\"><span>take</span>");
		html("</td>");
		html("</tr>");
		html();

		html("<tr>");
		html("<td class=\"lblcell\"><span id=\"acclbl\">".$accLbl."</span></td>");
		html("<td>");

		setTab(3);
		html("<select id=\"accid\" name=\"accid\" onchange=\"onChangeAcc();\">");
		echo($acc->getList($acc_id));
		html("</select>");
		setTab(2);

		html("</td>");
		html("</tr>");
		html();

		html("<tr>");
		html("<td class=\"lblcell\"><span>Amount</span></td>");
		echo($tabStr."<td><input id=\"amount\" name=\"amount\" type=\"text\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
		echo("<span id=\"amountsign\" class=\"currsign\">".$acc_sign."</span>");

		echo("<input id=\"ancurrbtn\" type=\"button\" onclick=\"showCurrList();\" value=\"currency\">");
		html();
		setTab(3);
		html("<select id=\"transcurr\" name=\"transcurr\" style=\"display: none;\" onchange=\"onChangeTransCurr();\">");
		echo(Currency::getList($acc_curr));
		html("</select>");
		setTab(2);

		html("</td>");
		html("</tr>");
		html();

		$disp = (($trans_type != 3 || ($trans_type == 3 && $src_curr == $dest_curr)) ? " style=\"display: none;\"" : "");
		html("<tr id=\"chargeoff\"".$disp.">");
		html("<td class=\"lblcell\"><span>Charge</span></td>");
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
		html("<td colspan=\"2\" style=\"text-align: center;\"><input id=\"submitbtn\" type=\"submit\" value=\"ok\"></td>");
		html("</tr>");
		setTab(1);

		html("</table>");
		html("</form>");
		html("</td>");
		html("</tr>");

		setTab(0);
	}
?>
</table>
</body>
</html>
