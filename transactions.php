<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");


	$userid = User::check();
	if (!$userid)
		setLocation("./login.php");
/*
	session_start();

	$userid = checkUser("./login.php");
*/

	$titleString = "jezve Money - Transactions";
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
?>
	<tr>
	<td class="submenu">
<?php
	if (isset($_GET["type"]) && ($_GET["type"] == "expense" || $_GET["type"] == "income" || $_GET["type"] == "transfer"))
		$transType = $_GET["type"];
	else
		$transType = "expense";

	if ($transType == "expense")
	{
		echo("<span>Expenses</span><span><a href=\"./transactions.php?type=income\">Income</a></span><span><a href=\"./transactions.php?type=transfer\">Transfers</a></span>");
	}
	else if ($transType == "income")
	{
		echo("<span><a href=\"./transactions.php?type=expense\">Expenses</a></span><span>Income</span><span><a href=\"./transactions.php?type=transfer\">Transfers</a></span>");
	}
	else if ($transType == "transfer")
	{
		echo("<span><a href=\"./transactions.php?type=expense\">Expenses</a></span><span><a href=\"./transactions.php?type=income\">Income</a></span><span>Transfers</span>");
	}
?>
	</td>
	</tr>

<?php
	if (isset($_GET["edit"]))
	{
		echo("<tr><td style=\"padding-left: 50px;\">");
		if ($_GET["edit"] == "ok")
			echo("<span style=\"color: #20FF20;\">Transaction successfully updated.</span>");
		else if ($_GET["edit"] == "fail")
			echo("<span style=\"color: #FF2020;\">Fail to updated transaction.</span>");
		echo("</td></tr>");
	}
	else if (isset($_GET["del"]))
	{
		echo("<tr><td style=\"padding-left: 50px;\">");
		if ($_GET["del"] == "ok")
			echo("<span style=\"color: #20FF20;\">Transaction successfully deleted.</span>");
		else if ($_GET["del"] == "fail")
			echo("<span style=\"color: #FF2020;\">Fail to delete transaction.</span>");
		echo("</td></tr>");
	}
?>

	<tr>
	<td>
	<table class="infotable">
<?php
	$acc = new Account($userid);

	$accounts = $acc->getCount();
	if (!$accounts)
	{
		echo("<tr><td><span>You have no one account. Please create one.</span></td></tr>");
	}
	else
	{
		$trtype_id = 0;
		if ($transType == "expense")
			$trtype_id = 1;
		else if ($transType == "income")
			$trtype_id = 2;
		else if ($transType == "transfer")
			$trtype_id = 3;

		$resArr = $db->selectQ("*", "transactions", "user_id=".$userid." AND type=".$trtype_id, NULL, "date ASC");
		$rowCount = count($resArr);
		if (!$rowCount)
		{
			echo("<tr><td>You have no one transaction yet.</td></tr>");
		}
		else
		{
			echo("<tr>");

			if ($transType == "expense")
				echo("<td><b>Source</b></td>");
			else if ($transType == "income")
				echo("<td><b>Destination</b></td>");
			else if ($transType == "transfer")
				echo("<td><b>Source</b></td><td><b>Destination</b></td>");

			echo("<td><b>Amount</b></td><td><b>Date</b></td><td><b>Comment</b></td><td></td></tr>");

			foreach($resArr as $row)
			{
				echo("<tr>");

				if ($transType == "expense" || $transType == "transfer")
					echo("<td>".$acc->getName($row["src_id"])."</td>");
				if ($transType == "income" || $transType == "transfer")
					echo("<td>".$acc->getName($row["dest_id"])."</td>");

				echo("<td style=\"text-align: right;\">". Currency::format($row["amount"], $row["curr_id"]));
				if ($row["charge"] != $row["amount"])
				{
					echo(" (");
					if ($trtype_id == 1 || $trtype_id == 3)		// expense or transfer
						echo(Currency::format($row["charge"], $acc->getCurrency($row["src_id"])));
					else if ($trtype_id == 2)					// income
						echo(Currency::format($row["charge"], $acc->getCurrency($row["dest_id"])));
					echo(")");
				}
				echo("</td>");

				$fdate = date("d.m.Y", strtotime($row["date"]));

				echo("<td>".$fdate."</td>");
				echo("<td>".$row["comment"]."</td>");
				echo("<td><a href=\"./edittransaction.php?id=".$row["id"]."\">edit</a> <a href=\"./deltransaction.php?id=".$row["id"]."\">delete</a></td>");
				echo("</tr>");
			}
		}
	}
?>
	</table>
	</td>
	</tr>
</table>
</body>
</html>
