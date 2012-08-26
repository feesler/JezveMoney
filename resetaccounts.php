<?php
require_once("./db.php");
require_once("./common.php");

session_start();

$userid = checkUser('./login.php');
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>jezve Money - Create new account</title>
<?php
	getStyle($sitetheme);
?>
<script type="text/javascript" src="./js/common.js"></script>
</head>
<body>
<table class="maintable">
	<tr><td style="width: 500px;"><h1 class="maintitle">jezve Money</h1></td></tr>

<?php
	require_once("./templates/userblock.php");
	require_once("./templates/mainmenu.php");
?>

	<tr>
	<td class="submenu">
		<span><a href="./createaccount.php">Create new</a></span><span><b>Reset</b></span>
	</td>
	</tr>

<?php
	if (isset($_GET["act"]) && $_GET["act"] == "fail")
	{
		echo("<tr><td style=\"padding-left: 50px;\">");
		echo("<span style=\"color: #FF2020;\">Fail to reset accounts.</span>");
		echo("</td></tr>");
	}
?>

	<tr>
	<td style="padding-left: 50px;">
	<form id="resetfrm" name="resetfrm" method="post" accept-charset="utf-8" action="./modules/resetaccounts.php">
	<table>
		<tr>
			<td align="right" style="padding-top: 50px;"><span>Are you sure want to reset all the data?</span></td>
		</tr>

		<tr>
			<td align="center"><input class="btn" type="submit" value="Ok"></td>
		</tr>
	</table>
	</form>
	</td>
	</tr>
</table>
</body>
</html>
