<?php
	require_once("./system/setup.php");


	function fail()
	{
		ebr("fail");
		exit();
	}


	// Wrap string with double quote
	function dquote($str)
	{
		return "\"".$str."\"";
	}


	// Convert uft-8 to cp-1251
	function cp1251($str)
	{
		return iconv("utf-8", "windows-1251", $str);
	}


	// Encode string value to CSV format
	function csv_encode($str)
	{
		$search = array("';'", "'\"'");
		$replacement = array("\\;", "\"\"");

		$conv_str = cp1251($str);

		return preg_replace($search, $replacement, $conv_str);
	}


	function csv_numeric($val)
	{
		return dquote(number_format($val, 2, ",", " "));
	}


	checkUser();

	if (!isset($_GET["id"]))
		fail();

	$checkAccount_id = intval($_GET["id"]);
	if (!$checkAccount_id)
		fail();


	$acc = new Account($user_id, TRUE);


	$realBalance = array();
	$curBalance = array();
	$initBalance = array();
	$accName = array();

	$condArr = array("user_id=".$user_id, "id=".$checkAccount_id);
	$resArr = $db->selectQ("*", "accounts", andJoin($condArr));
	foreach($resArr as $row)
	{
		$realBalance[$checkAccount_id] = floatval($row["initbalance"]);
	}

	$delim = ";";

	$resStr = "";
	$resStr .= "id".$delim."type".$delim."amount".$delim."charge".$delim."comment".$delim."balance".$delim."date\r\n";

	$condArr = array("user_id=".$user_id);
	if ($checkAccount_id != 0)
	{
		$accCond = array();
		$accCond[] = "(src_id=".$checkAccount_id." AND (type=1 OR type=3 OR type=4))";	// source
		$accCond[] = "(dest_id=".$checkAccount_id." AND (type=2 OR type=3 OR type=4))";	// destination
		$condArr[] = "(".orJoin($accCond).")";
	}

	$resArr = $db->selectQ("*", "transactions", andJoin($condArr), NULL, "pos");
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

		$src_name = $acc->getName($tr_src_id);
		$dest_name = $acc->getName($tr_dest_id);


		$resStr .= $tr_id.$delim;

		if ($tr_type == 1)				// expense
		{
			$resStr .= "Expense".$delim.csv_numeric(-$amount).$delim.csv_numeric(-$charge);

			$realBalance[$tr_src_id] = round($realBalance[$tr_src_id] - $charge, 2);
		}
		else if ($tr_type == 2)			// income
		{
			$resStr .= "Income".$delim.csv_numeric($amount).$delim.csv_numeric($charge);

			$realBalance[$tr_dest_id] = round($realBalance[$tr_dest_id] + $charge, 2);
		}
		else if ($checkAccount_id != 0 && $tr_type == 3 && $tr_dest_id == $checkAccount_id)			// transfer to
		{
			$resStr .= dquote("Transfer from ".csv_encode($src_name)).$delim.csv_numeric($amount).$delim.csv_numeric($charge);

			$realBalance[$checkAccount_id] = round($realBalance[$checkAccount_id] + $amount, 2);
		}
		else if ($checkAccount_id != 0 && $tr_type == 3 && $tr_src_id == $checkAccount_id)			// transfer from
		{
			$resStr .= dquote("Transfer to ".csv_encode($dest_name)).$delim.csv_numeric(-$amount).$delim.csv_numeric(-$charge);

			$realBalance[$checkAccount_id] = round($realBalance[$checkAccount_id] - $charge, 2);
		}
		else if ($tr_type == 4)
		{
			if ($tr_src_id == $checkAccount_id)	// I give
			{
				$resStr .= dquote(csv_encode("Debt: out")).$delim.csv_numeric(-$charge).$delim.csv_numeric(-$charge);
			}
			else if ($tr_dest_id == $checkAccount_id)	// I take
			{
				$resStr .= dquote(csv_encode("Debt: in")).$delim.csv_numeric($amount).$delim.csv_numeric($amount);
			}

			$realBalance[$tr_src_id] = round($realBalance[$tr_src_id] - $charge, 2);
			$realBalance[$tr_dest_id] = round($realBalance[$tr_dest_id] + $amount, 2);
		}

		$resStr .= $delim;
		if ($comment != "")
			$resStr .= dquote(csv_encode($comment));

		$resStr .= $delim.csv_numeric($realBalance[$checkAccount_id]).$delim.dquote(date("d.m.Y", strtotime($trdate)));

		$resStr .= "\r\n";
	}

	header("Content-Type: text/comma-separated-values");
	header("Content-Disposition: attachment; filename=\"file.csv\"");

	echo($resStr);
