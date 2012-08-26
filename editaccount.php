<?php
require_once("./db.php");
require_once("./common.php");


function fail()
{
	header("Location: ./accounts.php");
	exit();
}


session_start();

$userid = checkUser("./login.php");

if (!is_numeric($_GET['id']))
	fail();

$acc_id = intval($_GET['id']);

$arr = selectQuery('*', 'accounts', 'id='.$acc_id);
if (!$arr)
	fail();

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
function onSubmit(frm)
{
	var accname, accbalance;

	accname = ge('accname');
	initbal = ge('initbal');
	if (!frm || !accname || !initbal)
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

	initbal.value = fixFloat(initbal.value);
	frm.submit();

	return true;
}
</script>
</head>
<body>
<table align="center" valign="center" style="width: 100%; height: 100%;">
	<tr><td style="width: 500px;"><h1 class="maintitle">jezve Money</h1></td></tr>

<?php
	require_once("./templates/userblock.php");
	require_once("./templates/mainmenu.php");
?>
	<tr>
	<td style="padding-left: 50px;"><span style="margin-right: 25px; margin-left: 25px;"><a href="./createaccount.php">Create new</a></span><span style="margin-right: 25px; margin-left: 25px;"><b>Edit account</b><s/apn></td>
	</tr>

	<tr>
	<td style="padding-left: 50px;">
	<form id="editaccfrm" name="editaccfrm" method="post" accept-charset="utf-8" action="./modules/editaccount.php" onsubmit="return onSubmit(this);">
	<input id="accid" name="accid" type="hidden" value="<?php echo($acc_id); ?>">
	<table>
		<tr>
			<td align="right"><span style="margin-right: 5px;">Account name</span></td>
			<td><input class="inp" id="accname" name="accname" type="text" value="<?php echo($arr['name']); ?>"></td>
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
			echo("\t\t\t<option value=\"".$row['id']."\"".(($arr['curr_id'] == $row['id']) ? " selected" : "").">".$row['name']."</option>\r\n");
		}
	}
?>
			</select></td>
		</tr>
		<tr>
			<td align="right"><span style="margin-right: 5px;">Initial balance</span></td>
			<td><input class="inp" id="initbal" name="initbal" type="text" value="<?php echo($arr['initbalance']); ?>"></td>
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
