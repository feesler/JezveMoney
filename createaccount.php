<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");


	$userid = User::check();
	if (!$userid)
		setLocation("./login.php");

	$titleString = "jezve Money - Create new account";
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title><?php echo($titleString); ?></title>
<?php
	getStyle($sitetheme);
	echo(getJS("common.js"));
?>
<script>
var submitStarted = false;


// Submit new account event handler
function onSubmit(frm)
{
	var accname, accbalance;
	var submitbtn;

	if (submitStarted)
		return false;

	accname = ge("accname");
	accbalance = ge("accbalance");
	submitbtn = ge('submitbtn');
	if (!frm || !accname || !accbalance || !submitbtn)
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

	submitStarted = true;
	enable(submitbtn, false);

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
	<td class="submenu"><span><b>Create new</b></span><span><a href="./resetaccounts.php">Reset</a></span></td>
	</tr>

	<tr>
	<td style="padding-left: 50px;">
	<form method="post" action="./modules/createaccount.php" onsubmit="return onSubmit(this);">
	<table>
		<tr>
			<td style="text-align: right;"><span style="margin-right: 5px;">Account name</span></td>
			<td><input id="accname" name="accname" type="text"></td>
		</tr>
		<tr>
			<td style="text-align: right;"><span style="margin-right: 5px;">Currency</span></td>
			<td><select id="acccurr" name="acccurr">
<?php
	$curr = new Currency;

	echo($curr->getList());
?>
			</select></td>
		</tr>
		<tr>
			<td style="text-align: right;"><span style="margin-right: 5px;">Initial balance</span></td>
			<td><input id="accbalance" name="accbalance" type="text" value="0" onkeypress="return onFieldKey(event, this);"></td>
		</tr>
		<tr>
			<td colspan="2" style="text-align: center;"><input id="submitbtn" type="submit" value="Ok"></td>
		</tr>
	</table>
	</form>
	</td>
	</tr>
</table>
</body>
</html>
