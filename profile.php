<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/person.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");


	$userid = User::check();
	if (!$userid)
		setLocation("./login.php");

	$person_name = "";
	$owner_id = User::getOwner($userid);

	$person = new Person($userid);

	$person_name = $person->getName($owner_id);

	$titleString = "jezve Money - Profile";
?>
<!DOCTYPE html>
<html>
<head>
<title><?php echo($titleString); ?></title>
<?php
	getStyle($sitetheme);
	echo(getJS("common.js"));
?>
<script>
<?php
	html("var p_name = ".json_encode($person_name).";");
?>

// Change password submit event handler
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


// Change name form submit event handler
function onNameSubmit(frm)
{
	var newname;

	newname = ge('newname');
	if (!frm || !newname)
		return false;

	if (!newname.value || newname.value.length < 1)
	{
		alert('Please type new name.');
		return false;
	}

	if (newname.value == p_name)
	{
		alert('New name must be different from the old.');
		return false;
	}

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

	if (isset($_GET["pwd"]))
	{
		if ($_GET["pwd"] == "fail")
			echo("<tr><td><span style=\"color: #FF0000;\">Fail to change password</span></td></tr>");
		else if ($_GET["pwd"] == "ok")
			echo("<tr><td><span style=\"color: #00FF00;\">Password was successfully changed</span></td></tr>");
	}
	else if (isset($_GET["name"]))
	{
		if ($_GET["name"] == "fail")
			echo("<tr><td><span style=\"color: #FF0000;\">Fail to change name</span></td></tr>");
		else if ($_GET["name"] == "ok")
			echo("<tr><td><span style=\"color: #00FF00;\">Name was successfully changed</span></td></tr>");
	}
	else if (isset($_GET["resetall"]))
	{
		if ($_GET["resetall"] == "fail")
			echo("<tr><td><span style=\"color: #FF0000;\">Fail to reset all the data</span></td></tr>");
		else if ($_GET["resetall"] == "ok")
			echo("<tr><td><span style=\"color: #00FF00;\">Data successfully resetted</span></td></tr>");
	}
?>
	<tr>
	<td class="submenu"><span><b>Change password</b></span></td>
	</tr>

	<tr>
	<td>
	<form method="post" action="./modules/changepassword.php" onsubmit="return onSubmit(this);">
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

	<tr>
	<td class="submenu"><span><b>Change name</b></span></td>
	</tr>

	<tr>
	<td>
	<form method="post" action="./modules/changename.php" onsubmit="return onNameSubmit(this);">
	<table>
		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">New name</span></td>
		<td><input id="newname" name="newname" type="text"></td>
		</tr>

		<tr>
		<td></td>
		<td><input type="submit" value="ok"></td>
		</tr>
	</table>
	</form>
	</td>
	</tr>

	<tr>
	<td class="submenu"><span><b>Reset all data</b></span></td>
	</tr>

	<tr>
	<td>
	<table>
		<tr>
		<td>To reset all data click <a href="./resetall.php">here</a></td>
		</tr>
	</table>
	</td>
	</tr>
</table>
</body>
</html>
