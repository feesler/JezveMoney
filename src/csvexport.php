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
		$search = ["';'", "'\"'"];
		$replacement = ["\\;", "\"\""];

		$conv_str = cp1251($str);

		return preg_replace($search, $replacement, $conv_str);
	}


	function csv_numeric($val)
	{
		return dquote(number_format($val, 2, ",", " "));
	}


	$db = mysqlDB::getInstance();

	$uMod = UserModel::getInstance();
	$user_id = $uMod->check();
	if (!$user_id)
		fail();

	if (!isset($_GET["id"]))
		fail();

	$checkAccount_id = intval($_GET["id"]);
	if (!$checkAccount_id)
		fail();


	$accMod = AccountModel::getInstance();


	$realBalance = [];
	$curBalance = [];
	$initBalance = [];
	$accName = [];

	$condArr = ["user_id=".$user_id, "id=".$checkAccount_id];
	$qResult = $db->selectQ("*", "accounts", $condArr);
	while($row = $db->fetchRow($qResult))
	{
		$realBalance[$checkAccount_id] = floatval($row["initbalance"]);
	}

	$delim = ";";

	$resStr = "";
	$resStr .= "id".$delim."type".$delim."amount".$delim."charge".$delim."comment".$delim."balance".$delim."date\r\n";

	$condArr = ["user_id=".$user_id];
	if ($checkAccount_id != 0)
	{
		$accCond = [
			andJoin([ "src_id=".$checkAccount_id, "type".inSetCondition([ EXPENSE, TRANSFER, DEBT ]) ]),
			andJoin([ "dest_id=".$checkAccount_id, "type".inSetCondition([ INCOME, TRANSFER, DEBT ]) ])
		];

		$condArr[] = orJoin($accCond);
	}

	$qResult = $db->selectQ("*", "transactions", $condArr, NULL, "pos");
	while($row = $db->fetchRow($qResult))
	{
		$tr_id = intval($row["id"]);
		$tr_type = intval($row["type"]);
		$tr_src_id = intval($row["src_id"]);
		$tr_dest_id = intval($row["dest_id"]);
		$src_amount = floatval($row["src_amount"]);
		$dest_amount = floatval($row["dest_amount"]);
		$src_result = floatval($row["src_result"]);
		$dest_result = floatval($row["dest_result"]);
		$comment = $row["comment"];
		$trdate = $row["date"];
		$tr_pos = intval($row["pos"]);

		$srcAccount = $accMod->getItem($tr_src_id);
		$src_name = $srcAccount ? $srcAccount->name : NULL;

		$destAccount = $accMod->getItem($tr_dest_id);
		$dest_name = $srcAccount ? $srcAccount->name : NULL;

		$resStr .= $tr_id.$delim;

		$realBalance = ($tr_src_id == $checkAccount_id) ? $src_result : $dest_result;

		if ($tr_type == 1)				// expense
		{
			$resStr .= "Expense".$delim.csv_numeric(-$src_amount).$delim.csv_numeric(-$dest_amount);
		}
		else if ($tr_type == 2)			// income
		{
			$resStr .= "Income".$delim.csv_numeric($src_amount).$delim.csv_numeric($dest_amount);
		}
		else if ($checkAccount_id != 0 && $tr_type == 3 && $tr_dest_id == $checkAccount_id)			// transfer to
		{
			$resStr .= dquote("Transfer from ".csv_encode($src_name)).$delim.csv_numeric($src_amount).$delim.csv_numeric($dest_amount);
		}
		else if ($checkAccount_id != 0 && $tr_type == 3 && $tr_src_id == $checkAccount_id)			// transfer from
		{
			$resStr .= dquote("Transfer to ".csv_encode($dest_name)).$delim.csv_numeric(-$src_amount).$delim.csv_numeric(-$dest_amount);
		}
		else if ($tr_type == 4)
		{
			if ($tr_src_id == $checkAccount_id)	// I give
			{
				$resStr .= dquote(csv_encode("Debt: out")).$delim.csv_numeric(-$dest_amount).$delim.csv_numeric(-$dest_amount);
			}
			else if ($tr_dest_id == $checkAccount_id)	// I take
			{
				$resStr .= dquote(csv_encode("Debt: in")).$delim.csv_numeric($src_amount).$delim.csv_numeric($src_amount);
			}
		}

		$resStr .= $delim;
		if ($comment != "")
			$resStr .= dquote(csv_encode($comment));

		$resStr .= $delim.csv_numeric($realBalance).$delim.dquote(date("d.m.Y", strtotime($trdate)));

		$resStr .= "\r\n";
	}

	header("Content-Type: text/comma-separated-values");
	header("Content-Disposition: attachment; filename=\"file.csv\"");

	echo($resStr);
