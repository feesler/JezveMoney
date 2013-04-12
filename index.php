<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");
	require_once("./class/transaction.php");


	$userid = User::check();
	if (!$userid)
		setLocation("./login.php");

	$titleString = "jezve Money";
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

	showSubMenu($newTransArr);

	$acc = new Account($userid);
	$trans = new Transaction($userid);

	setTab(1);
	html("<tr>");
	html("<td>");

	setTab(2);
	html("<div class=\"mainwidget\">");
	html("<span>Accounts</span>");
	echo($acc->getTable());
	html("</div>");
	html("<div class=\"mainwidget\">");
	html("<span>Latest</span>");
	echo($trans->getLatest(10));
	html("</div>");

	html("</td>");
	html("</tr>");
?>
</table>
</body>
</html>
