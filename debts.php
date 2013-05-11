<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");
	require_once("./class/debt.php");

	$userid = User::check();
	if (!$userid)
		setLocation("./login.php");

	$titleString = "jezve Money - Debts";
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

	$debtsArr = array(array(1, "New", "newdebt.php"));

	showSubMenu($debtsArr);

	if (isset($_GET["debt"]))
	{
		echo("<tr><td style=\"padding-left: 50px;\">");
		if ($_GET["debt"] == "ok")
			echo("<span style=\"color: #20FF20;\">Debt successfully created.</span>");
		else if ($_GET["debt"] == "fail")
			echo("<span style=\"color: #FF2020;\">Fail to create new debt.</span>");
		echo("</td></tr>");
	}

	$debt = new Debt($userid);

	echo($debt->getTable());
?>
</table>
</body>
</html>
