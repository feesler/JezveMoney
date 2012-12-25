<?php
require_once("./setup.php");

function fail()
{
	setLocation("./index.php");
	exit();
}

session_start();

$userid = checkUser("./login.php");

if (isset($_GET["id"]) && is_numeric($_GET["id"]))
{
	$acc_id = intval($_GET["id"]);

	$resArr = $db->selectQ("*", "accounts", "id=".$acc_id." AND user_id=".$userid);
	if (count($resArr) != 1)
		fail();
}
else		// try to get first account of user
{
	$resArr = $db->selectQ("*", "accounts", "user_id=".$userid);
	if (count($resArr) == 0)
		fail();
}

$acc_id = intval($resArr[0]["id"]);
if (!$acc_id)
	fail();


if (isset($_GET["type"]) && ($_GET["type"] == "expense" || $_GET["type"] == "income" || $_GET["type"] == "transfer"))
	$transType = $_GET["type"];
else
	$transType = "expense";

if ($transType == "expense")
	$transType_id = 1;
else if ($transType == "income")
	$transType_id = 2;
else if ($transType == "transfer")
	$transType_id = 3;
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>jezve Money - Delete transaction</title>
<?php
	getStyle($sitetheme);
	echo(getCSS("chart.css"));
?>
<script type="text/javascript" src="./js/common.js"></script>
<script type="text/javascript" src="./js/chart.js"></script>
<script>
<?php
	echo("\tvar transType = '".$transType."';\r\n");

	$statArr = getStatArray($userid, $acc_id, $transType_id);
	echo("\tvar chartData = [".$statArr."];\r\n");
?>

// Accountchange event handler
function onAccountChange(obj)
{
	var acc_id;

	if (!obj)
		return;

	acc_id = parseInt(selectedValue(obj));

	window.location = './statistics.php?id=' + acc_id + '&type=' + transType;
}
</script>
</head>
<body>
<table class="maintable">
	<tr><td><h1 class="maintitle">jezve Money - Statistics</h1></td></tr>

<?php
	require_once("./templates/userblock.php");
	require_once("./templates/mainmenu.php");
?>

	<tr>
	<td class="submenu">
<?php
	if ($transType == "expense")
	{
		echo("<span>Expenses</span><span><a href=\"./statistics.php?id=".$acc_id."&type=income\">Income</a></span><span><a href=\"./statistics.php?id=".$acc_id."&type=transfer\">Transfers</a></span>");
	}
	else if ($transType == "income")
	{
		echo("<span><a href=\"./statistics.php?id=".$acc_id."&type=expense\">Expenses</a></span><span>Income</span><span><a href=\"./statistics.php?id=".$acc_id."&type=transfer\">Transfers</a></span>");
	}
	else if ($transType == "transfer")
	{
		echo("<span><a href=\"./statistics.php?id=".$acc_id."&type=expense\">Expenses</a></span><span><a href=\"./statistics.php?id=".$acc_id."&type=income\">Income</a></span><span>Transfers</span>");
	}
?>
	</td>
	</tr>

	<tr>
	<td style="padding-left: 50px;">
	<table>
		<tr>
		<td align="right"><span style="margin-right: 5px;">Account name</span></td>
		<td>
		<select id="accsel" class="sel" onchange="onAccountChange(this);">
<?php
	echo(getAccountsList($userid, $acc_id));
?>
		</select>
		</td>
		</tr>
	</table>
	</td>
	</tr>

	<tr>
	<td>
		<div id="chartsbg"></div>
		<div id="chart" class="chartcontent"></div>
	</td>
	</tr>
</table>
<script>initApp();</script>
</body>
</html>
