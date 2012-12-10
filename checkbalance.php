<?php
	require_once("./setup.php");

	function ebr($str = "")
	{
		echo($str."<br>");
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

	ebr(getAccountName($checkAccount_id));

	$resArr = $db->selectQ("*", "accounts", "id=".$checkAccount_id." AND user_id=".$userid);
	if (count($resArr) != 1)
		fail();

	$initBalance = floatval($resArr[0]["initbalance"]);
	$curBalance = floatval($resArr[0]["balance"]);

	ebr("initBalance: ".$initBalance);
	ebr("curBalance: ".$curBalance);
	ebr();

	$realBalance = $initBalance;

	// incomes
	ebr();
	ebr("incomes");
	$resArr = $db->selectQ("*", "transactions", "dest_id=".$checkAccount_id." AND type=2 ORDER BY date ASC");
	foreach($resArr as $row)
	{
		$charge = floatval($row["charge"]);
		$comment = $row["comment"];

		$realBalance += $charge;
		ebr("+".$charge." ".$comment);
	}

	// expenses
	ebr();
	ebr("expenses");
	$resArr = $db->selectQ("*", "transactions", "src_id=".$checkAccount_id." AND type=1 ORDER BY date ASC");
	foreach($resArr as $row)
	{
		$charge = floatval($row["charge"]);
		$comment = $row["comment"];

		$realBalance -= $charge;
		ebr("-".$charge." ".$comment);
	}

	// transfers
	ebr();
	ebr("transfers from");
	$resArr = $db->selectQ("*", "transactions", "src_id=".$checkAccount_id." AND type=3 ORDER BY date ASC");
	foreach($resArr as $row)
	{
		$charge = floatval($row["charge"]);
		$comment = $row["comment"];

		$realBalance -= $charge;
		ebr("-".$charge." ".$comment);
	}

	// transfers
	ebr();
	ebr("transfers to");
	$resArr = $db->selectQ("*", "transactions", "dest_id=".$checkAccount_id." AND type=3 ORDER BY date ASC");
	foreach($resArr as $row)
	{
		$amount = floatval($row["amount"]);
		$comment = $row["comment"];

		$realBalance += $amount;
		ebr("+".$amount." ".$comment);
	}

	ebr();
	ebr("realBalance: ".$realBalance);
?>