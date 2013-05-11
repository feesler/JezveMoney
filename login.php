<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");


	$userid = User::check();
	if ($userid != 0)
		setLocation("./index.php");

	$titleString = "jezve Money - Log in";
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
var submitStarted = false;


// Log in form submit event handler
function onSubmit(frm)
{
	var logacc, logpwd, submitbtn;

	if (submitStarted)
		return false;

	logacc = ge('logacc');
	logpwd = ge('logpwd');
	submitbtn = ge('submitbtn');
	if (!frm || !logacc || !logpwd || !submitbtn)
		return false;

	if (!logacc.value || logacc.value.length < 1)
	{
		alert('Please type your login.');
		return false;
	}

	if (!logpwd.value || logpwd.value.length < 1)
	{
		alert('Please type your password.');
		return false;
	}

	submitStarted = true;
	enable(submitbtn, false);

	return true;
}
</script>
</head>
<body>
<form method="post" action="./modules/login.php" onsubmit="return onSubmit(this);">
<table align="center" valign="center" style="width: 100%; height: 100%;">
	<tr><td><h1 class="maintitle"><?php echo($titleString); ?></h1></td></tr>
<?php
	if ($_GET["act"] == "wrong")
		echo("<tr><td>Wrong login/password. Please check it and try to retype again.</td></tr>");
?>
	<tr height="100%">
	<td style="width: 100%; height: 100%;" align="center" valign="center">
	<table width="300px" height="150px">
		<tr>
			<td class="lblcell"><span>Login</span></td>
			<td><input id="logacc" name="logacc" type="text"></td>
		</tr>
		<tr>
			<td class="lblcell"><span>Password</span></td>
			<td><input id="logpwd" name="logpwd" type="password"></td>
		</tr>
		<tr>
			<td></td>
			<td><input id="submitbtn" value="ok" type="submit"><a style="margin-left: 5px;" href="./registration.php">sign in</a></td>
		</tr>
	</table>
	</td>
	</tr>
</table>
</form>
</body>
</html>
