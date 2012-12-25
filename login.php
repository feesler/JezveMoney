<?php
	require_once("./setup.php");

	session_start();

	if (isset($_SESSION["userid"]))
	{
		header("Location: ./index.php");
		exit();
	}
	else
	{
		if (isset($_COOKIE["login"]) && isset($_COOKIE["passhash"]))
		{
			$qlogin = $_COOKIE["login"];
			$passhash = $_COOKIE["passhash"];

			$resArr = $db->selectQ("*", "users", "login=".qnull($qlogin)." AND passhash=".qnull($passhash));
			if (count($resArr) == 1)
			{
				session_start();
				$_SESSION["userid"] = intval($resArr[0]["id"]);

				$expTime = time() + 31536000;	// year after now
				$path = "/money/";
				$domain = "jezve.net";

				setcookie("login", $qlogin, $expTime, $path, $domain);
				setcookie("passhash", $passhash, $expTime, $path, $domain);

				header("Location: ./index.php");
				exit();
			}
		}
	}
?>
<!DOCTYPE html>
<html>
<head>
<title>jezve Money - Log in</title>
<link rel="stylesheet" type="text/css" href="./css/common.css">
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
	<tr><td><h1 class="maintitle">jezve Money</h1></td></tr>
<?php
	if ($_GET["act"] == "wrong")
		echo("<tr><td>Wrong login/password. Please check it and try to retype again.</td></tr>");
?>
	<tr height="100%">
	<td style="width: 100%; height: 100%;" align="center" valign="center">
	<table width="300px" height="150px">
		<tr>
			<td align="right"><span style="margin-right: 5px; text-align: right;">Login</span></td>
			<td><input id="logacc" name="logacc" type="text"></td>
		</tr>
		<tr>
			<td align="right"><span style="margin-right: 5px; text-align: right;">Password</span></td>
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
