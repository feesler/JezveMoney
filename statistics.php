<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");

	function fail()
	{
		setLocation("./index.php");
		exit();
	}


	// Return string with first capital letter and small others
	function firstCap($str)
	{
		if (!$str || $str == "")
			return $str;

		return strtoupper($str[0]).strtolower(substr($str, 1));
	}


	$userid = User::check();
	if (!$userid)
		setLocation("./login.php");

	$acc = new Account($userid);

	if (isset($_GET["id"]) && is_numeric($_GET["id"]))
	{
		$acc_id = intval($_GET["id"]);

		if (!$acc->is_exist($acc_id))
			fail();
	}
	else		// try to get first account of user
	{
		$acc_id = $acc->getIdByPos(0);
		if (!$acc_id)
			fail();
	}


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


	$groupTypes = array("None", "Day", "Week", "Month", "Year");

	$groupType = NULL;
	$groupType_id = 0;
	if (isset($_GET["group"]))
	{
		foreach($groupTypes as $val => $grtype)
		{
			if (strtolower($_GET["group"]) == strtolower($grtype))
			{
				$groupType_id = $val;
				break;
			}
		}

		if ($groupType_id != 0)
			$groupType = strtolower($groupTypes[$groupType_id]);
	}

	$titleString = "jezve Money - Statistics";
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title><?php echo($titleString); ?></title>
<?php
	getStyle($sitetheme);
	echo(getCSS("chart.css"));
?>
<script type="text/javascript" src="./js/common.js"></script>
<script type="text/javascript" src="./js/chart.js"></script>
<script>
<?php
	echo("\tvar transType = ".json_encode($transType).";\r\n");
	echo("\tvar groupType = ".json_encode($groupType).";\r\n");

	$statArr = getStatArray($userid, $acc_id, $transType_id, $groupType_id);
	echo("\tvar chartData = [".$statArr."];\r\n");
?>


// Return group parameter for specifyed type
function getGroupParam(id)
{
	if (id == 1)
		return '&group=day';
	else if (id == 2)
		return '&group=week';
	else if (id == 3)
		return '&group=month';
	else if (id == 4)
		return '&group=year';
	else
		return '';
}


// Group change event handler
function onGroupChange(obj)
{
	var acc_id, group_id;
	var accsel, groupsel;

	accsel = ge('accsel');
	groupsel = ge('groupsel');
	if (!accsel || !groupsel)
		return;

	acc_id = parseInt(selectedValue(accsel));
	group_id = parseInt(selectedValue(groupsel))

	window.location = './statistics.php?id=' + acc_id + '&type=' + transType + getGroupParam(group_id);
}


// Account change event handler
function onAccountChange()
{
	var acc_id, group_id;
	var accsel, groupsel;

	accsel = ge('accsel');
	groupsel = ge('groupsel');
	if (!accsel || !groupsel)
		return;

	acc_id = parseInt(selectedValue(accsel));
	group_id = parseInt(selectedValue(groupsel));

	window.location = './statistics.php?id=' + acc_id + '&type=' + transType + getGroupParam(group_id);
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
<?php
	if ($transType == "expense")
	{
		echo("<span>Expenses</span><span><a href=\"./statistics.php?id=".$acc_id."&amp;type=income\">Income</a></span><span><a href=\"./statistics.php?id=".$acc_id."&amp;type=transfer\">Transfers</a></span>");
	}
	else if ($transType == "income")
	{
		echo("<span><a href=\"./statistics.php?id=".$acc_id."&amp;type=expense\">Expenses</a></span><span>Income</span><span><a href=\"./statistics.php?id=".$acc_id."&amp;type=transfer\">Transfers</a></span>");
	}
	else if ($transType == "transfer")
	{
		echo("<span><a href=\"./statistics.php?id=".$acc_id."&amp;type=expense\">Expenses</a></span><span><a href=\"./statistics.php?id=".$acc_id."&amp;type=income\">Income</a></span><span>Transfers</span>");
	}
?>
	</td>
	</tr>

	<tr>
	<td style="padding-left: 50px;">
	<table>
		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Account name</span></td>
		<td>
		<select id="accsel" onchange="onAccountChange();">
<?php
	echo($acc->getList($acc_id));
?>
		</select>
		</td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Group by</span></td>
		<td>
		<select id="groupsel" onchange="onGroupChange();">
<?php
	foreach($groupTypes as $val => $grtype)
	{
		echo("\t\t\t<option value=\"".$val."\"");
		if ($val == $groupType_id)
			echo(" selected");
		echo(">".$grtype."</option>\r\n");
	}
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
