<?php
require_once("./common.php");


function fail()
{
echo("<!-- fail -->");

	header("Location: ./manage.php");
	exit();
}


session_start();

$userid = checkUser("./login.php");


if ($_GET['id'] != intval($_GET['id']))
	fail();

$acc_id = intval($_GET['id']);

?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>jezve Money - Edit account</title>
<?php
	getStyle($sitetheme);
?>
<script type="text/javascript" src="./js/common.js"></script>
<script>
function onSubmit()
{
	var editaccfrm, accname, accbalance;

	editaccfrm = ge('editaccfrm');
	accname = ge('accname');
	initbal = ge('initbal');
	if (!editaccfrm || !accname || !initbal)
		return false;

	if (!accname.value || !accname.value.length)
	{
		alert('Please input account name.');
		return false;
	}

	if (!initbal.value || !initbal.value.length || !isNum(initbal.value))
	{
		alert('Please input correct initial balance.');
		return false;
	}

	editaccfrm.action = './modules/editaccount.php';
	editaccfrm.submit();

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
	<span style="margin-right: 20px;"><?php	echo(getUserName($userid)); ?> logged in</span><input class="btn" type="submit" value="Logout">
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
	<td style="padding-left: 50px;"><span style="margin-right: 25px; margin-left: 25px;"><a href="./createaccount.php">Create new</a></span><span style="margin-right: 25px; margin-left: 25px;"><b>Edit account</b><s/apn></td>
	</tr>

	<tr>
	<td style="padding-left: 50px;">
	<form id="editaccfrm" name="editaccfrm" method="post" accept-charset="utf-8" action="" onsubmit="return onSubmit()">
	<input id="acc_id" name="acc_id" type="hidden" value="<?php echo($acc_id); ?>">
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
			<td><input class="inp" id="initbal" name="initbal" type="text" value="0"></td>
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
