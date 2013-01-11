<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");


	function fail()
	{
		setLocation("./accounts.php");
		exit();
	}


	$userid = User::check();
	if (!$userid)
		setLocation("./login.php");
/*
	session_start();

	$userid = checkUser("./login.php");
*/

	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
		fail();

	$acc_id = intval($_GET["id"]);

	$acc = new Account($userid);

	if (!$acc->is_exist($acc_id))
		fail();

	$titleString = "jezve Money - Edit account";
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title><?php echo($titleString); ?></title>
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

	if (!initbal.value || !initbal.value.length || !isNum(fixFloat(initbal.value)))
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
<table class="maintable">
	<tr><td><h1 class="maintitle"><?php echo($titleString); ?></h1></td></tr>

<?php
	require_once("./templates/userblock.php");
	require_once("./templates/mainmenu.php");
?>
	<tr>
	<td class="submenu"><span><a href="./createaccount.php">Create new</a></span><span><b>Edit account</b></span></td>
	</tr>

	<tr>
	<td style="padding-left: 50px;">
	<form id="editaccfrm" name="editaccfrm" method="post" accept-charset="utf-8" action="./modules/editaccount.php" onsubmit="return onSubmit(this);">
	<input id="accid" name="accid" type="hidden" value="<?php echo($acc_id); ?>">
	<table>
		<tr>
			<td style="text-align: right;"><span style="margin-right: 5px;">Account name</span></td>
			<td><input id="accname" name="accname" type="text" value="<?php echo($acc->getName($acc_id)); ?>"></td>
		</tr>
		<tr>
			<td style="text-align: right;"><span style="margin-right: 5px;">Currency</span></td>
			<td><select id="acccurr" name="acccurr">
<?php
	echo(Currency::getList($acc->getCurrency($acc_id)));
?>
			</select></td>
		</tr>
		<tr>
			<td style="text-align: right;"><span style="margin-right: 5px;">Initial balance</span></td>
			<td><input id="initbal" name="initbal" type="text" value="<?php echo($acc->getInitBalance($acc_id)); ?>" onkeypress="return onFieldKey(event, this);"></td>
		</tr>
		<tr>
			<td colspan="2" style="text-align: center;"><input type="submit" value="Ok"></td>
		</tr>
	</table>
	</form>
	</td>
	</tr>
</table>
</body>
</html>
