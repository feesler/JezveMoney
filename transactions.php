<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/person.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");
	require_once("./class/transaction.php");


	$userid = User::check();
	if (!$userid)
		setLocation("./login.php");

	$type_str = (isset($_GET["type"])) ? $_GET["type"] : "expense";

	$trans_type = Transaction::getStringType($type_str);
	if (!$trans_type)
		fail();


	$acc = new Account($userid);

	$acc_id = (isset($_GET["acc_id"])) ? intval($_GET["acc_id"]) : 0;
	if ($acc_id && !$acc->is_exist($acc_id))
		$acc_id = 0;

	$page_num = (isset($_GET["page"]) && is_numeric($_GET["page"])) ? (intval($_GET["page"]) - 1) : 0;

	$titleString = "jezve Money - Transactions";
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title><?php echo($titleString); ?></title>
<?php
	getStyle($sitetheme);
	html(getJS("common.js"));

	html("<script>");
	html("var transType = ".json_encode($type_str).";");
	html("var curAccId = ".json_encode($acc_id).";");
?>

// Account change event handler
function onAccountChange()
{
	var acc_id, accsel;
	var newLocation;

	accsel = ge('accsel');
	if (!accsel)
		return;

	acc_id = parseInt(selectedValue(accsel));

	if (curAccId == acc_id)
		return;

	newLocation = './transactions.php?type=' + transType;
	if (acc_id != 0)
		newLocation += '&acc_id=' + acc_id;

	window.location = newLocation;
}
</script>
</head>
<body>
<table class="maintable">
	<tr><td><h1 class="maintitle"><?php echo($titleString); ?></h1></td></tr>
<?php
	require_once("./templates/userblock.php");
	require_once("./templates/mainmenu.php");
	require_once("./templates/submenu.php");

	$accLinkStr = ($acc_id ? "&acc_id=".$acc_id : "");

	$transactionsArr = array(array(4, "All", "transactions.php?type=all".$accLinkStr),
						array(1, "Expenses", "transactions.php?type=expense".$accLinkStr),
						array(2, "Incomes", "transactions.php?type=income".$accLinkStr),
						array(3, "Transfers", "transactions.php?type=transfer".$accLinkStr));

	showSubMenu($transactionsArr);

	if (isset($_GET["edit"]))
	{
		echo("<tr><td style=\"padding-left: 50px;\">");
		if ($_GET["edit"] == "ok")
			echo("<span style=\"color: #20FF20;\">Transaction successfully updated.</span>");
		else if ($_GET["edit"] == "fail")
			echo("<span style=\"color: #FF2020;\">Fail to updated transaction.</span>");
		echo("</td></tr>");
	}
	else if (isset($_GET["del"]))
	{
		echo("<tr><td style=\"padding-left: 50px;\">");
		if ($_GET["del"] == "ok")
			echo("<span style=\"color: #20FF20;\">Transaction successfully deleted.</span>");
		else if ($_GET["del"] == "fail")
			echo("<span style=\"color: #FF2020;\">Fail to delete transaction.</span>");
		echo("</td></tr>");
	}

	echo("<tr><td style=\"padding-left: 50px;\">");

	html("<table>");
	html("<tr>");
	html("<td class=\"lblcell\"><span>Account</span></td>");
	html("<td>");

	html("<select id=\"accsel\" onchange=\"onAccountChange();\">");
	html("<option value=\"0\"".(($acc_id == 0) ? " selected" : "").">All</option>");
	echo($acc->getList($acc_id));
	html("</select>");

	html("</td>");
	html("</tr>");
	html("</table>");
	html("</td></tr>");

	$trans = new Transaction($userid);

	html("<tr>");
	html("<td>");
	echo($trans->getTable($trans_type, $acc_id, 30, $page_num));
	html("</td>");
	html("</tr>");
?>
</table>
</body>
</html>
