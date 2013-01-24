<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");


	$userid = User::check();
	if (!$userid)
		setLocation("./login.php");

	$titleString = "jezve Money";
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title><?php echo($titleString); ?></title>
<?php
	getStyle($sitetheme);
?>
</head>
<body>
<table class="maintable">
	<tr><td><h1 class="maintitle"><?php echo($titleString); ?></h1></td></tr>

<?php
	require_once("./templates/userblock.php");
	require_once("./templates/mainmenu.php");

	$subMenuArr = array(array(1, "Spend", "newtransaction.php?type=expense"),
						array(2, "Income", "newtransaction.php?type=income"),
						array(3, "Transfer", "newtransaction.php?type=transfer"));

	function showSubMenu($arr)
	{
		global $ruri;
		global $trans_type;

		if (!is_array($arr))
			return;

		foreach($arr as $trTypeArr)
		{
			echo("<span>");
			if ($trans_type == $trTypeArr[0])
				echo("<b>".$trTypeArr[1]."</b>");
			else
				echo("<a href=\"./".$trTypeArr[2]."\">".$trTypeArr[1]."</a>");
			echo("</span>");
		}
	}
?>

	<tr>
	<td class="submenu">
<?php
	showSubMenu($subMenuArr);
?>
	</td>
	</tr>

<?php
	$acc = new Account($userid);

	echo($acc->getTable(TRUE));
?>
</table>
</body>
</html>
