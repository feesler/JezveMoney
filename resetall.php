<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");


	$userid = User::check();
	if (!$userid)
		setLocation("./login.php");

	$titleString = "jezve Money - Reset all data";
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title><?php echo($titleString); ?></title>
<?php
	getStyle($sitetheme);
	echo(getJS("common.js"));
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
	<td style="padding-left: 50px;">
	<form method="post" action="./modules/resetall.php">
	<table>
		<tr>
			<td style="padding-top: 50px;"><span>Are you sure want to reset all the data?<br>All accounts, transactions and persons will be lost.</span></td>
		</tr>

		<tr>
			<td style="text-align: center;"><input type="submit" value="Ok"><a href="./profile.php" style="margin-left: 10px;">Cancel</a></td>
		</tr>
	</table>
	</form>
	</td>
	</tr>
</table>
</body>
</html>
