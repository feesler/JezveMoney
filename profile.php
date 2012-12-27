<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");

	session_start();

	$userid = checkUser("./login.php");

	$titleString = "jezve Money - Profile";
?>
<!DOCTYPE html>
<html>
<head>
<title><?php echo($titleString); ?></title>
<?php
	getStyle($sitetheme);
?>
<script type="text/javascript" src="./js/common.js"></script>
<script>
function onSubmit(frm)
{
	var oldpwd, newpwd;

	oldpwd = ge('oldpwd');
	newpwd = ge('newpwd');
	if (!frm || !oldpwd || !newpwd)
		return false;

	if (!oldpwd.value || oldpwd.value.length < 1)
	{
		alert('Please type your current password.');
		return false;
	}

	if (!newpwd.value || newpwd.value.length < 1)
	{
		alert('Please type new password.');
		return false;
	}

	if (newpwd.value == oldpwd.value)
	{
		alert('New password must be different from the old.');
		return false;
	}

	frm.submit();

	return true;
}
</script>
</head>
<body>
<table class="maintable">
	<tr><td><h1 class="maintitle"><?php echo($titleString); ?></h1></td></tr>
<?php
	require_once("./templates/userblock.php");
	require_once("./templates/mainmenu.php");

	if (isset($_GET["act"]))
	{
		if ($_GET["act"] == "fail")
			echo("<tr><td><span style=\"color: #FF0000;\">Fail to change password</span></td></tr>");
		else if ($_GET["act"] == "ok")
			echo("<tr><td><span style=\"color: #00FF00;\">Password was successfully changed</span></td></tr>");
	}
?>
	<tr>
	<td class="submenu"><span><b>Change password</b></span></td>
	</tr>

	<tr>
	<td>
	<form id="pdwchangefrm" name="pdwchangefrm" method="post" action="./modules/changepassword.php" onsubmit="return onSubmit(this);">
	<table>
		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Old password</span></td>
		<td><input id="oldpwd" name="oldpwd" type="password"></td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">New password</span></td>
		<td><input id="newpwd" name="newpwd" type="password"></td>
		</tr>

		<tr>
		<td></td>
		<td><input type="submit" value="ok"></td>
		</tr>
	</table>
	</form>
	</td>
	</tr>
</table>
</body>
</html>
