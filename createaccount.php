<?php
require_once("./db.php");
require_once("./common.php");

session_start();

$userid = checkUser('./login.php');
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
<table class="maintable">
	<tr><td style="width: 500px;"><h1 class="maintitle">jezve Money</h1></td></tr>

<?php
	require_once("./templates/userblock.php");
	require_once("./templates/mainmenu.php");
?>

	<tr>
	<td class="submenu"><span><b>Create new</b></span></td>
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
