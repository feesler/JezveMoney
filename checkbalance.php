<?php
	require_once("./setup.php");

	function ebr($str = "")
	{
		echo($str."\r\n");
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

	ebr("<!DOCTYPE HTML>");
	ebr("<html>");
	ebr("<head>");
	ebr("<title>Check balance</title>");
	ebr("</head>");
	ebr("<body>");

	ebr("<table>");
	ebr("<tr><td colspan=\"3\">".getAccountName($checkAccount_id)."</td></tr>");

	$resArr = $db->selectQ("*", "accounts", "id=".$checkAccount_id." AND user_id=".$userid);
	if (count($resArr) != 1)
		fail();

	$initBalance = floatval($resArr[0]["initbalance"]);
	$curBalance = floatval($resArr[0]["balance"]);

	ebr("<tr><td colspan=\"3\">initBalance: ".$initBalance."</td></tr>");
	ebr("<tr><td colspan=\"3\">curBalance: ".$curBalance."</td></tr>");
	ebr();

	$realBalance = $initBalance;

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

	ebr("<tr><td colspan=\"3\"></td></tr>");
	ebr("<tr><td colspan=\"3\">realBalance: ".$realBalance."</td></tr>");
	ebr("<tr><td colspan=\"3\">diference: ".($realBalance - $curBalance)."</td></tr>");
	ebr("</table>");

	ebr("</body>");
	ebr("</html>");
?>