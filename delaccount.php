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

	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
		fail();

	$acc_id = intval($_GET["id"]);

	$acc = new Account($userid);
	if (!$acc->is_exist($acc_id))
		fail();

	$acc_name = $acc->getName($acc_id);

	$titleString = "jezve Money - Delete account";
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


// Delete transaction form submit event handler
function onSubmit(frm)
{
	var submitbtn;

	if (submitStarted)
		return false;

	submitbtn = ge('submitbtn');
	if (!frm || !submitbtn)
		return false;

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
	<td class="submenu">
		<span><a href="./transactions.php?type=expense">Expenses</a></span><span><a href="./transactions.php?type=income">Income</a></span><span><a href="./transactions.php?type=transfer">Transfers</a></span>
	</td>
	</tr>

	<tr>
	<td style="padding-left: 50px;">
	<form method="post" action="./modules/delaccount.php" onsubmit="return onSubmit(this);">
	<input name="accounts" type="hidden" value="<?php echo($acc_id); ?>">
	<table>
		<tr>
			<td style="text-align: left; padding-top: 50px;"><span>Are you sure want to delete <b><?php echo($acc_name); ?></b> account?<br>All income and expense transactions history will be lost.<br>Transfer to this account will be changed to expense.<br>Transfer from this account will be changed to income.</span></td>
		</tr>

		<tr>
			<td style="text-align: center;"><input id="submitbtn" type="submit" value="Ok"></td>
		</tr>
	</table>
	</form>
	</td>
	</tr>
</table>
</body>
</html>
