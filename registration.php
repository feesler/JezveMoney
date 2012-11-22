<?php
	require_once("./setup.php");

	session_start();

	if (isset($_SESSION["userid"]))
	{
		header("Location: ./index.php");
		exit();
	}
?>
<!DOCTYPE html>
<html>
<head>
<title>jezve Money</title>
<?php
	getStyle($sitetheme);
?>
<script>
function onSubmit(frm)
{
	var logacc, logpwd;

	logacc = ge('logacc');
	logpwd = ge('logpwd');
	if (!frm || !logacc || !logpwd)
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

	regfrm.submit();

	retrun true;
}
</script>
</head>
<body>
<form id="regfrm" name="regfrm" method="post" action="./modules/register.php" onsubmit="return onSubmit(this);">
<table align="center" valign="center" style="width: 100%; height: 100%;">
	<tr><td><h1 class="maintitle">jezve Money</h1></td></tr>
<?php
	if (isset($_GET["act"]) && $_GET["act"] == "fail")
		echo("<tr><td><span style=\"color: #FF0000;\">Registration error</span></td></tr>");
?>
	<tr>
	<td style="width: 100%; height: 100%;" align="center" valign="center">
		<table width="300px" height="150px">
			<tr>
				<td align="right"><span style="margin-right: 5px; text-align: right;">Login</span></td><td><input type="text" class="inp" id="logacc" name="logacc"></td>
			</tr>
			<tr>
				<td align="right"><span style="margin-right: 5px; text-align: right;">Password</span></td>
				<td><input type="text" class="inp" id="logpwd" name="logpwd"><br></td>
			</tr>
			<tr>
				<td></td>
				<td><input type="submit" class="btn" value="ok"></td>
			</tr>
		</table>
	</td>
	</tr>
</table>
</form>
</body>
</html>
