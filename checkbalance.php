<?php
	require_once("./setup.php");

	function ebr($str = "")
	{
		echo($str."\r\n");
	}


	function htmlComm($str)
	{
		echo("<!-- ".$str." -->\r\n");
	}


	function fail()
	{
		ebr("fail");
		exit();
	}

	session_start();

	$userid = checkUser("./login.php");


	if (!isset($_GET["id"]))
		fail();
	$checkAccount_id = intval($_GET["id"]);
	if (!$checkAccount_id)
		fail();

	$fixed = FALSE;

	if (isset($_GET["act"]) && $_GET["act"] == "fix")
	{
		if (isset($_POST["fixbal"]))
		{
			$fixbal = floatval($_POST["fixbal"]);

			if (!$db->updateQ("accounts", array("balance"), array($fixbal), "id=".$checkAccount_id))
				fail();

			$fixed = TRUE;
		}
	}


	ebr("<!DOCTYPE HTML>");
	ebr("<html>");
	ebr("<head>");
	ebr("<title>Check balance</title>");
	ebr("<style>");
	ebr("td{ padding: 2px 5px; }");
	ebr("</style>");
	ebr("</head>");
	ebr("<body>");

	if ($fixed)
		ebr("<span style=\"color: #80FF80;\">Balance value was fixed</span><br>");

	ebr("<table>");
	ebr("<tr><td colspan=\"8\">".getAccountName($checkAccount_id)."</td></tr>");

	$resArr = $db->selectQ("*", "accounts", "id=".$checkAccount_id." AND user_id=".$userid);
	if (count($resArr) != 1)
		fail();

	$initBalance = floatval($resArr[0]["initbalance"]);
	$curBalance = floatval($resArr[0]["balance"]);

	ebr("<tr><td colspan=\"8\">initBalance: ".$initBalance."</td></tr>");
	ebr("<tr><td colspan=\"8\">curBalance: ".$curBalance."</td></tr>");
	ebr();

	$realBalance = $initBalance;


	ebr("<tr><td>Type</td><td>Amount</td><td>Charge</td><td>Comment</td><td>Real balance</td><td>Date</td><td>Pos</td><td>ID</td></tr>");

	$resArr = $db->selectQ("*", "transactions", "(src_id=".$checkAccount_id." AND (type=1 OR type=3)) OR (dest_id=".$checkAccount_id." AND (type=2 OR type=3))", NULL, "pos");
	foreach($resArr as $row)
	{
		$tr_id = intval($row["id"]);
		$tr_type = intval($row["type"]);
		$tr_src_id = intval($row["src_id"]);
		$tr_dest_id = intval($row["dest_id"]);
		$amount = floatval($row["amount"]);
		$charge = floatval($row["charge"]);
		$comment = $row["comment"];
		$trdate = $row["date"];
		$tr_pos = intval($row["pos"]);

		echo("<tr>");

		if ($tr_type == 1)				// expense
		{
			echo("<td>Expense</td><td");

			if ($amount == $charge)
				echo(" colspan=\"2\" align=\"center\">-".$charge."</td>");
			else
				echo(">-".$amount."</td><td style=\"background-color: #B0FFB0;\">-".$charge."</td>");

			$realBalance = round($realBalance - $charge, 2);
		}
		else if ($tr_type == 2)			// income
		{
			echo("<td>Income</td><td");

			if ($amount == $charge)
				echo(" colspan=\"2\" align=\"center\">+".$charge."</td>");
			else
				echo(">+".$amount."</td><td style=\"background-color: #B0FFB0;\">+".$charge."</td>");

			$realBalance = round($realBalance + $charge, 2);
		}
		else if ($tr_type == 3 && $tr_dest_id == $checkAccount_id)			// transfer to
		{
			echo("<td>Transfer to</td><td");

			if ($amount == $charge)
				echo(" colspan=\"2\" align=\"center\">+".$charge."</td>");
			else
				echo(" style=\"background-color: #B0FFB0;\">+".$amount."</td><td>+".$charge."</td>");

			$realBalance = round($realBalance + $amount, 2);
		}
		else if ($tr_type == 3 && $tr_src_id == $checkAccount_id)			// transfer from
		{
			echo("<td>Transfer from</td><td");

			if ($amount == $charge)
				echo(" colspan=\"2\" align=\"center\">-".$charge."</td>");
			else
				echo(">-".$amount."</td><td style=\"background-color: #B0FFB0;\">-".$charge."</td>");

			$realBalance = round($realBalance - $charge, 2);
		}

		ebr("<td>".$comment."</td><td>".$realBalance."</td><td>".date("d.m.Y", strtotime($trdate))."</td><td>".$tr_pos."</td><td>".$tr_id."</td></tr>");
	}

/*
	// incomes
	ebr();
	ebr("<tr><td colspan=\"3\">incomes</td></tr>");
	$resArr = $db->selectQ("*", "transactions", "dest_id=".$checkAccount_id." AND type=2 ORDER BY date ASC");
	foreach($resArr as $row)
	{
		$amount = floatval($row["amount"]);
		$charge = floatval($row["charge"]);
		$comment = $row["comment"];

		$realBalance += $charge;
		ebr("<tr><td>+".$charge.(($charge != $amount) ? " (".$amount.")" : "")."</td><td>".$comment."</td><td>".$realBalance."</td></tr>");
	}

	// expenses
	ebr();
	ebr("<tr><td colspan=\"3\">expenses</td></tr>");
	$resArr = $db->selectQ("*", "transactions", "src_id=".$checkAccount_id." AND type=1 ORDER BY date ASC");
	foreach($resArr as $row)
	{
		$amount = floatval($row["amount"]);
		$charge = floatval($row["charge"]);
		$comment = $row["comment"];

		$realBalance -= $charge;
		ebr("<tr><td>-".$charge.(($charge != $amount) ? " (".$amount.")" : "")."</td><td>".$comment."</td><td>".$realBalance."</td></tr>");
	}

	// transfers
	ebr();
	ebr("<tr><td colspan=\"3\">transfers from</td></tr>");
	$resArr = $db->selectQ("*", "transactions", "src_id=".$checkAccount_id." AND type=3 ORDER BY date ASC");
	foreach($resArr as $row)
	{
		$amount = floatval($row["amount"]);
		$charge = floatval($row["charge"]);
		$comment = $row["comment"];

		$realBalance -= $charge;
		ebr("<tr><td>-".$charge.(($charge != $amount) ? " (".$amount.")" : "")."</td><td>".$comment."</td><td>".$realBalance."</td></tr>");
	}

	// transfers
	ebr();
	ebr("<tr><td colspan=\"3\">transfers to</td></tr>");
	$resArr = $db->selectQ("*", "transactions", "dest_id=".$checkAccount_id." AND type=3 ORDER BY date ASC");
	foreach($resArr as $row)
	{
		$amount = floatval($row["amount"]);
		$charge = floatval($row["charge"]);
		$comment = $row["comment"];

		$realBalance += $amount;
		ebr("<tr><td>+".$amount.(($charge != $amount) ? " (".$charge.")" : "")."</td><td>".$comment."</td><td>".$realBalance."</td></tr>");
	}
*/

	$balanceDiff = round($realBalance - $curBalance, 2);

	ebr("<tr><td colspan=\"8\"></td></tr>");
	ebr("<tr><td colspan=\"8\">realBalance: ".$realBalance."</td></tr>");
	ebr("<tr><td colspan=\"8\">diference: ".$balanceDiff."</td></tr>");
	ebr("</table>");

	if ($balanceDiff != 0)
	{
		ebr("<form method=\"post\" action=\"./checkbalance.php?id=".$checkAccount_id."&act=fix\">");
		ebr("<input name=\"fixbal\" type=\"hidden\" value=\"".$realBalance."\">");
		ebr("<input type=\"submit\" value=\"Fix balance\">");
		ebr("</form>");
	}


	ebr("</body>");
	ebr("</html>");
?>