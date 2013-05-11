<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");


	$userid = User::check();
	if ($userid != 0)
		setLocation("./index.php");

	$titleString = "jezve Money - Registration";
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


// Registration form submit event handler
function onSubmit(frm)
{
	var logacc, logpwd, username, submitbtn;

	if (submitStarted)
		return false;

	logacc = ge('logacc');
	logpwd = ge('logpwd');
	username = ge('username');
	submitbtn = ge('submitbtn');
	if (!frm || !logacc || !logpwd || !username || !submitbtn)
		return false;

	if (!logacc.value || logacc.value.length < 1)
	{
		alert('Please type your login.');
		return false;
	}

	if (!username.value || username.value.length < 1)
	{
		alert('Please type your name.');
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
<form method="post" action="./modules/register.php" onsubmit="return onSubmit(this);">
<table align="center" valign="center" style="width: 100%; height: 100%;">
	<tr><td><h1 class="maintitle"><?php echo($titleString); ?></h1></td></tr>
<?php
	if (isset($_GET["act"]) && $_GET["act"] == "fail")
		echo("<tr><td><span style=\"color: #FF0000;\">Registration error</span></td></tr>");
?>
	<tr>
	<td style="width: 100%; height: 100%;" align="center" valign="center">
		<table width="300px" height="150px">
			<tr>
				<td class="lblcell"><span>Login</span></td><td><input id="logacc" name="logacc" type="text"></td>
			</tr>
			<tr>
				<td class="lblcell"><span>Name</span></td>
				<td><input id="username" name="username" type="text"><br></td>
			</tr>
			<tr>
				<td class="lblcell"><span>Password</span></td>
				<td><input id="logpwd" name="logpwd" type="password"><br></td>
			</tr>
			<tr>
				<td></td>
				<td><input id="submitbtn" type="submit" value="ok"></td>
			</tr>
		</table>
	</td>
	</tr>
</table>
</form>
</body>
</html>
