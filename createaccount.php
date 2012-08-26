<?php
require_once("./db.php");
require_once("./common.php");

session_start();

if (isset($_SESSION["userid"]))
{
	$userid = $_SESSION["userid"];
}
else
{
	header("Location: ./login.php");
	exit();
}
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
<script>
function onSubmit()
{
	var newaccfrm, accname, accbalance;

	newaccfrm = ge('newaccfrm');
	accname = ge('accname');
	accbalance = ge('accbalance');
	if (!newaccfrm || !accname || !accbalance)
		return false;

	if (!accname.value || !accname.value.length)
	{
		alert('Please input account name.');
		return false;
	}

	newaccfrm.action = './modules/createaccount.php';
	newaccfrm.submit();

	return true;
}
</script>
</head>
<body>
<table align="center" valign="center" style="width: 100%; height: 100%;">
	<tr><td style="width: 500px;"><h1 class="maintitle">jezve Money</h1></td></tr>

	<tr>
	<td style="margin-top: 15px; margin-right: 30px; width: 100%; height: 30px;" align="right">
	<form id="logoutfrm" name="logoutfrm" method="post" action="./modules/logout.php">
	<span style="margin-right: 20px;"><?php
	$query = "SELECT * FROM `users` WHERE `id`='".$userid."';";
	$result = mysql_query($query, $dbcnx);
	if(!mysql_errno() && mysql_num_rows($result) == 1)
	{
		$row = mysql_fetch_array($result);
		if ($row)
		{
			echo($row['login']." logged in");
		}
	}
?></span><input class="btn" type="submit" value="Logout">
	</form>
	</td>
	</tr>

	<tr>
	<td style="padding-left: 50px;">
	<span style="font-weight: bold; margin-right: 25px; margin-left: 25px;">Accounts</span>
	<span style="margin-right: 25px; margin-left: 25px;"><a href="#">Transactions</a></span>
	<span style="margin-right: 25px; margin-left: 25px;"><a href="#">Statistics</a></span>
	</td>
	</tr>

	<tr>
	<td style="padding-left: 50px;"><b>Create new</b></td>
	</tr>

	<tr>
	<td style="padding-left: 50px;">
	<form id="newaccfrm" name="newaccfrm" method="post" accept-charset="utf-8" action="" onsubmit="return onSubmit()">
	<table>
		<tr>
			<td align="right"><span style="margin-right: 5px;">Account name</span></td>
			<td><input class="inp" id="accname" name="accname" type="text"></td>
		</tr>
		<tr>
			<td align="right"><span style="margin-right: 5px;">Currency</span></td>
			<td><select class="inp" id="acccurr" name="acccurr">
<?php
	$query = "SELECT * FROM `currency`;";
	$result = mysql_query($query, $dbcnx);
	if(!mysql_errno() && mysql_num_rows($result) > 0)
	{
		while($row = mysql_fetch_array($result))
		{
			echo("\t\t\t<option value=\"".$row['id']."\">".$row['name']."</option>\r\n");
		}
	}
?>
			</select></td>
		</tr>
		<tr>
			<td align="right"><span style="margin-right: 5px;">Initial balance</span></td>
			<td><input class="inp" id="accbalance" name="accbalance" type="text" value="0"></td>
		</tr>
		<tr>
			<td colspan="2" align="center"><input class="btn" type="submit" value="Ok"></td>
		</tr>
	</table>
	</form>
	</td>
	</tr>
</table>
</body>
</html>
