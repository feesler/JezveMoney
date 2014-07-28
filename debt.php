<?php
	require_once("./setup.php");


	function fail($msg = NULL)
	{
		if (!is_null($msg))
			setMessage($msg);
		setLocation("./index.php");
	}


	checkUser();

	$acc = new Account($user_id, TRUE);
	$trans = new Transaction($user_id);
	$debt = new Debt($user_id);
	$person = new Person($user_id);

	if (isset($_GET["act"]))
		$action = $_GET["act"];
	else
		$action = "new";
	if ($action != "new" && $action != "edit")
		fail();

if ($action == "new")
{
	// check predefined account
	$acc_id = 0;
	if (isset($_GET["acc_id"]))
		$acc_id = intval($_GET["acc_id"]);
	if (!$acc_id || !$acc->is_exist($acc_id))		// TODO : think about redirect or warning message
		$acc_id = $acc->getIdByPos(0);
	if (!$acc_id)
		fail();

	$debtAcc = $acc->getProperties($acc_id);

	// Prepare person account
	$person_id = $person->getIdByPos(0);
	$person_name = $person->getName($person_id);

	$person_acc_id = $person->getAccount($person_id, $debtAcc["curr"]);
	$person_acc = $acc->getProperties($person_acc_id);
	$person_res_balance = $person_acc ? $person_acc["balance"] : 0.0;
	$person_balance = $person_res_balance;

	$tr = array("src_id" => $person_acc_id, "dest_id" => $acc_id, "amount" => 0, "charge" => 0, "curr" => $debtAcc["curr"], "type" => 4, "comment" => "");
	$trans_type = 4;
	$give = TRUE;
}
else
{
	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
		fail(ERR_DEBT_UPDATE);

	$trans_id = intval($_GET["id"]);
	if (!$trans->is_exist($trans_id))
		fail(ERR_DEBT_UPDATE);

	$tr = $trans->getProperties($trans_id);
	$trans_type = $tr["type"];			// TODO : temporarily
}

	// Prepare transaction types menu
	$trTypes = array("Expense", "Income", "Transfer");
	$transMenu = array();
	$baseUrl = "./transaction.php";
	foreach($trTypes as $ind => $trTypeName)
	{
		$params = array("act" => "new", "type" => strtolower($trTypeName));
		if ($acc_id != 0)
			$params["acc_id"] = $acc_id;

		$transMenu[] = array(($ind + 1), $trTypeName, urlJoin($baseUrl, $params));
	}
	$params = array();
	if ($acc_id != 0)
		$params["acc_id"] = $acc_id;
	$transMenu[] = array(($ind + 2), "Debt", urlJoin("./debt.php", $params));

	// Common arrays
	$currArr = Currency::getArray(TRUE);
	$accArr = $acc->getArray();
	$persArr = $person->getArray();

if ($action == "new")
{
	$tr["src_id"] = $person_acc_id;

	$noAccount = FALSE;

	$amountCurr = $debtAcc["curr"];
	$chargeCurr = $debtAcc["curr"];
}
else
{
	// get information about source and destination accounts
	$src = $acc->getProperties($tr["src_id"]);
	$dest = $acc->getProperties($tr["dest_id"]);

	$user_owner = $u->getOwner($user_id);
	$give = (!is_null($src) && $src["owner"] != $user_owner);

	$person_id = ($give) ? $src["owner"] : $dest["owner"];
	$person_name = $person->getName($person_id);

	$person_acc_id = ($give) ? $tr["src_id"] : $tr["dest_id"];
	$person_acc = $acc->getProperties($person_acc_id);
	$person_res_balance = $person_acc["balance"];
	$person_balance = $person_res_balance + (($give) ? $tr["amount"] : -$tr["amount"]);

	$debtAcc = $give ? $dest : $src;
	$noAccount = is_null($debtAcc);

	$amountCurr = $tr["curr"];
	if ($noAccount)
	{
		$chargeCurr = $person_acc["curr"];
		$acc_id = $acc->getIdByPos(0);
		$acc_name = $acc->getName($acc_id);
		$acc_balance = Currency::format($acc->getBalance($acc_id), $acc->getCurrency($acc_id));
		$acc_ic = $acc->getIconClass($acc->getIcon($acc_id));
	}
	else
	{
		$acc_id = 0;
		$chargeCurr = $debtAcc["curr"];
	}
}

	$acc = new Account($user_id);
	$acc_count = $acc->getCount();

	if ($noAccount)
	{
		$accLbl = "No account";
	}
	else
	{
		if ($give)
			$accLbl = "Destination account";
		else
			$accLbl = "Source account";
	}

	$debtAcc["balfmt"] = Currency::format($debtAcc["balance"] + $tr["charge"], $debtAcc["curr"]);

	$p_balfmt = Currency::format($person_balance, $amountCurr);

	$amountSign = Currency::getSign($amountCurr);
	$chargeSign = Currency::getSign($chargeCurr);
	$exchSign = $debtAcc["sign"]."/".$debtAcc["sign"];
	$exchValue = ($action == "new") ? 1 : round($tr["amount"] / $tr["charge"], 5);

	$rtAmount = Currency::format($tr["amount"], $amountCurr);
	$rtCharge = Currency::format($tr["charge"], $chargeCurr);
	$rtExchange = $exchValue." ".$exchSign;
	$rtSrcResBal = Currency::format($person_res_balance, $amountCurr);
	$rtDestResBal = Currency::format($debtAcc["balance"], $debtAcc["curr"]);

	$dateFmt = ($action == "new") ? date("d.m.Y") : date("d.m.Y", strtotime($tr["date"]));

	$titleString = "Jezve Money | ";
	$headString = ($action == "new") ? "New debt" : "Edit debt";
	$titleString .= $headString;

	$cssArr = array("common.css", "transaction.css", "tiles.css", "iconlink.css", "ddlist.css", "calendar.css");
	$jsArr = array("common.js", "currency.js", "account.js", "ready.js", "calendar.js", "ddlist.js", "transaction.js", "transaction_layout.js");
	if ($action == "edit")
	{
		$cssArr[] = "popup.css";
		$jsArr[] = "popup.js";
	}

	include("./templates/debt.tpl");
?>