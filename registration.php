<?php
require_once("./db.php");
?>
<!DOCTYPE html>
<html>
<head>
<title>jezve Money</title>
<link rel="stylesheet" type="text/css" href="./css/common.css">
<?php
echo("<link rel=\"stylesheet\" type=\"text/css\" href=\"./css/");
if ($sitetheme == 1)
	echo("white.css");
else
	echo("black.css");
echo("\">\r\n");
?>
<script>
function onBtnClick()
{
	var regfrm, logacc, logpwd;

	regfrm = document.getElementById('regfrm');
	logacc = document.getElementById('logacc');
	logpwd = document.getElementById('logpwd');
	if (!regfrm || !logacc || !logpwd)
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

	regfrm.action = './modules/register.php';
	regfrm.submit();
}
</script>
</head>
<body>
<form id="regfrm" name="regfrm" method="post" action="">
<table align="center" valign="center" style="width: 100%; height: 100%;">
	<tr><td><h1 class="maintitle">jezve Money</h1></td></tr>
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
				<td><input type="button" class="btn" onclick="onBtnClick()" value="ok"></td>
			</tr>
		</table>
	</td>
	</tr>
</table>
</form>
</body>
</html>
