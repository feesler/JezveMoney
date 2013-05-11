<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");


	function fail()
	{
		setLocation("./transactions.php");
		exit();
	}


	$userid = User::check();
	if (!$userid)
		setLocation("./login.php");

	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
		fail();

	$trans_id = intval($_GET["id"]);

	$resArr = $db->selectQ("*", "transactions", "id=".$trans_id." AND user_id=".$userid);
	if (count($resArr) != 1)
		fail();

	$titleString = "jezve Money - Delete transaction";
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
	<form id="resetfrm" name="resetfrm" method="post" accept-charset="utf-8" action="./modules/deltransaction.php" onsubmit="return onSubmit(this);">
	<input name="transid" type="hidden" value="<?php echo($trans_id); ?>">
	<table>
		<tr>
			<td style="text-align: right; padding-top: 50px;"><span>Are you sure want to delete transaction?</span></td>
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
