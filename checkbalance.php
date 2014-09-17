﻿<?php
	require_once("./setup.php");


	function fail()
	{
		echo("fail");
		exit();
	}

	checkUser();

	if (!isset($_GET["id"]))
		fail();

	if ($_GET["id"] == "all")
	{
		$checkAccount_id = 0;
	}
	else
	{
		$checkAccount_id = intval($_GET["id"]);
		if (!$checkAccount_id)
			fail();
	}

	$fixed = FALSE;

	if (isset($_GET["act"]) && $_GET["act"] == "fix" && $checkAccount_id != 0)
	{
		if (isset($_POST["fixbal"]))
		{
			$fixbal = floatval($_POST["fixbal"]);

			if (!$db->updateQ("accounts", array("balance"), array($fixbal), "id=".$checkAccount_id))
				fail();

			$fixed = TRUE;
		}
	}


	if (isset($_GET["pos"]))
	{
		if ($_GET["pos"] == "ok")
			$posUpd = TRUE;
		else if ($_GET["pos"] == "fail")
			$posUpd = FALSE;
	}


	$acc = new Account($user_id, TRUE);

	$condition = "user_id=".$user_id;
	if ($checkAccount_id != 0)
		$condition .= " AND id=".$checkAccount_id;
	$resArr = $db->selectQ("*", "accounts", $condition);
	if (count($resArr) == 0)
		fail();

	$initBalance = array();
	$curBalance = array();
	$realBalance = array();
	$accName = array();
	foreach($resArr as $row)
	{
		$acc_id = intval($row["id"]);
		$initBalance[$acc_id] = floatval($row["initbalance"]);
		$curBalance[$acc_id] = floatval($row["balance"]);
		$accName[$acc_id] = $acc->getNameOrPerson($acc_id);

		$realBalance[$acc_id] = $initBalance[$acc_id];
	}


	$accNameCache = array();

	$prev_date = 0;

	$condition = "user_id=".$user_id;
	if ($checkAccount_id != 0)
	{
		$condition .= " AND (";
		$condition .= "(src_id=".$checkAccount_id." AND (type=1 OR type=3 OR type=4))";	// source
		$condition .= " OR (dest_id=".$checkAccount_id." AND (type=2 OR type=3 OR type=4))";	// destination
		$condition .= ")";
	}

	$resArr = $db->selectQ("*", "transactions", $condition, NULL, "pos");
	$transArr = array();
	foreach($resArr as $row)
	{
		$tr_id = intval($row["id"]);
		$tr = array("type"=> intval($row["type"]),
					"src_id"=> intval($row["src_id"]),
					"dest_id"=> intval($row["dest_id"]),
					"src_amount"=> floatval($row["src_amount"]),
					"dest_amount"=> floatval($row["dest_amount"]),
					"comment"=> $row["comment"],
					"date"=> strtotime($row["date"]),
					"pos" => intval($row["pos"]));

		$tr["src_name"] = $acc->getNameOrPerson($tr["src_id"]);
		$tr["dest_name"] = $acc->getNameOrPerson($tr["dest_id"]);

		if ($tr_type == 1)
		{
			$realBalance[$tr["src_id"]] = round($realBalance[$tr["src_id"]] - $tr["charge"], 2);
			$tr["realbal"] = array($realBalance[$tr["src_id"]]);
		}
		else if ($tr_type == 2)
		{
			$realBalance[$tr["dest_id"]] = round($realBalance[$tr["dest_id"]] + $tr["dest_amount"], 2);
			$tr["realbal"] = array($realBalance[$tr["dest_id"]]);
		}
		else if ($checkAccount_id != 0 && $tr["type"] == 3 && $tr["dest_id"] == $checkAccount_id)		/* transfer to */
		{
			$realBalance[$checkAccount_id] = round($realBalance[$checkAccount_id] + $tr["dest_amount"], 2);
			$tr["realbal"] = array($realBalance[$checkAccount_id]);
		}
		else if ($checkAccount_id != 0 && $tr["type"] == 3 && $tr["src_id"] == $checkAccount_id)		/* transfer from */
		{
			$realBalance[$checkAccount_id] = round($realBalance[$checkAccount_id] - $tr["src_amount"], 2);
			$tr["realbal"] = array($realBalance[$checkAccount_id]);
		}
		else if ($checkAccount_id == 0 && $tr["type"] == 3)		/* Transfer between two accounts */
		{
			$realBalance[$tr["src_id"]] = round($realBalance[$tr["src_id"]] - $tr["src_amount"], 2);
			$realBalance[$tr["dest_id"]] = round($realBalance[$tr["dest_id"]] + $tr["dest_amount"], 2);
			$tr["realbal"] = array($realBalance[$tr["src_id"]], $realBalance[$tr["dest_id"]]);
		}
		else if ($tr_type == 4)
		{
			$realBalance[$tr["src_id"]] = round($realBalance[$tr["src_id"]] - $tr["src_amount"], 2);
			$realBalance[$tr["dest_id"]] = round($realBalance[$tr["dest_id"]] + $tr["dest_amount"], 2);
			$tr["realbal"] = array($realBalance[$tr["src_id"]], $realBalance[$tr["dest_id"]]);
		}

		$tr["correctdate"] = ($tr["date"] >= $prev_date);
		if ($tr["correctdate"])
			$prev_date = $tr["date"];
		$tr["datefmt"] = date("d.m.Y", $tr["date"]);

		$transArr[$tr_id] = $tr;
	}


	$balanceDiff = array();
	foreach($realBalance as $acc_id => $rbrow)
	{
		$balanceDiff[$acc_id] = round($rbrow - $curBalance[$acc_id], 2);
	}


	$titleString = "jezve Money - Check balance";

	$cssArr = array();
	$jsArr = array("common.js");

	header("Content-type: text/html; charset=utf-8");

	include("./templates/checkbalance.tpl");
?>