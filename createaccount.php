<?php
require_once("./setup.php");

session_start();

$userid = checkUser("./login.php");
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
function onSubmit(frm)
{
	var accname, accbalance;

	accname = ge("accname");
	accbalance = ge("accbalance");
	if (!frm || !accname || !accbalance)
		return false;

	if (!accname.value || !accname.value.length)
	{
		alert("Please input account name.");
		return false;
	}

	if (!accbalance.value || !accbalance.value.length || !isNum(fixFloat(accbalance.value)))
	{
		alert("Please input correct balance.");
		return false;
	}

	accbalance.value = fixFloat(accbalance.value);

	frm.submit();

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
	<td class="submenu"><span><b>Create new</b></span><span><a href="./resetaccounts.php">Reset</a></span></td>
	</tr>

	<tr>
	<td style="padding-left: 50px;">
	<form id="newaccfrm" name="newaccfrm" method="post" accept-charset="utf-8" action="./modules/createaccount.php" onsubmit="return onSubmit(this);">
	<table>
		<tr>
			<td align="right"><span style="margin-right: 5px;">Account name</span></td>
			<td><input class="inp" id="accname" name="accname" type="text"></td>
		</tr>
		<tr>
			<td align="right"><span style="margin-right: 5px;">Currency</span></td>
			<td><select class="inp" id="acccurr" name="acccurr">
<?php
	echo(getCurrencyList());
?>
			</select></td>
		</tr>
		<tr>
			<td align="right"><span style="margin-right: 5px;">Initial balance</span></td>
			<td><input class="inp" id="accbalance" name="accbalance" type="text" value="0" onkeypress="return onFieldKey(event, this);"></td>
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
