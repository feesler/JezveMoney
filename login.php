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
?>
<script>
function onSubmit()
{
	var loginfrm, logacc, logpwd;

	loginfrm = document.getElementById('loginfrm');
	logacc = document.getElementById('logacc');
	logpwd = document.getElementById('logpwd');
	if (!loginfrm || !logacc || !logpwd)
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

	loginfrm.action = './modules/login.php';
	loginfrm.submit();

	return true;
}
</script>
</head>
<body>
<form id="loginfrm" name="loginfrm" method="post" action="" onsubmit="return onSubmit()">
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
			<td style="text-align: right;"><span style="margin-right: 5px; text-align: right;">Login</span></td>
			<td><input id="logacc" name="logacc" type="text"></td>
		</tr>
		<tr>
			<td style="text-align: right;"><span style="margin-right: 5px; text-align: right;">Password</span></td>
			<td><input id="logpwd" name="logpwd" type="password"></td>
		</tr>
		<tr>
			<td></td>
			<td><input value="ok" type="submit"><a style="margin-left: 5px;" href="./registration.php">sign in</a></td>
		</tr>
	</table>
	</td>
	</tr>
</table>
</form>
</body>
</html>
