<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");


	$userid = User::check();
	if (!$userid)
		setLocation("./login.php");

	$titleString = "jezve Money - Accounts";
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
?>

	<tr>
	<td class="submenu">
	<span><a href="./createaccount.php">Create new</a></span><span><a href="./resetaccounts.php">Reset</a></span>
	</td>
	</tr>

<?php
	if (isset($_GET["newacc"]))
	{
		echo("<tr><td style=\"padding-left: 50px;\">");

		if ($_GET["newacc"] == "ok")
			echo("<span style=\"color: #20FF20;\">Account added.</span>");
		else if ($_GET["newacc"] == fail)
			echo("<span style=\"color: #FF2020;\">Fail to add account.</span>");
		echo("</td></tr>");
	}
	else if (isset($_GET["edit"]))
	{
		echo("<tr><td style=\"padding-left: 50px;\">");

		if ($_GET["edit"] == "ok")
			echo("<span style=\"color: #20FF20;\">Account data saved.</span>");
		else if ($_GET["edit"] == fail)
			echo("<span style=\"color: #FF2020;\">Fail to edit account.</span>");
		echo("</td></tr>");
	}
	else if (isset($_GET["reset"]) && $_GET["reset"] == "ok")
	{
		echo("<tr><td style=\"padding-left: 50px;\">");
		echo("<span style=\"color: #20FF20;\">Accounts is successfully reseted.</span>");
		echo("</td></tr>");
	}
?>

<?php
	$acc = new Account($userid);

	echo($acc->getTable(FALSE, TRUE));
?>
</table>
</body>
</html>
