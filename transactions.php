<?php
	require_once("./setup.php");
	require_once("./class/user.php");
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

	$titleString = "jezve Money - Transactions";
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title><?php echo($titleString); ?></title>
<?php
	getStyle($sitetheme);
?>
</head>
<body>
<table class="maintable">
	<tr><td><h1 class="maintitle"><?php echo($titleString); ?></h1></td></tr>
<?php
	require_once("./templates/userblock.php");
	require_once("./templates/mainmenu.php");
	require_once("./templates/submenu.php");

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

	$trans = new Transaction($userid);

	echo($trans->getTable($trans_type));
?>
</table>
</body>
</html>
