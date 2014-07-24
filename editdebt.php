<?php
	require_once("./setup.php");


	function fail()
	{
		setMessage(ERR_DEBT_UPDATE);
		setLocation("./index.php");
	}


	checkUser();

	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
		fail();

	$trans_type = 4;

	$trans_id = intval($_GET["id"]);

	$acc = new Account($user_id, TRUE);
	$trans = new Transaction($user_id);
	$debt = new Debt($user_id);
	$person = new Person($user_id);

	if (!$trans->is_exist($trans_id))
		fail();

	$tr = $trans->getProperties($trans_id);
	$trans_type = $tr["type"];			// TODO : temporarily

	// Prepare transaction types menu
	$trTypes = array("Expense", "Income", "Transfer");
	$transMenu = array();
	$baseUrl = "./newtransaction.php";
	foreach($trTypes as $ind => $trTypeName)
	{
		$params = array("type" => strtolower($trTypeName));
		if ($acc_id != 0)
			$params["acc_id"] = $acc_id;

		$transMenu[] = array(($ind + 1), $trTypeName, urlJoin($baseUrl, $params));
	}
	$params = array();
	if ($acc_id != 0)
		$params["acc_id"] = $acc_id;
	$transMenu[] = array(($ind + 2), "Debt", urlJoin("./newdebt.php", $params));

	// Common arrays
	$currArr = Currency::getArray(TRUE);
	$accArr = $acc->getArray();
	$persArr = $person->getArray();

	// get information about source and destination accounts
	$src = $acc->getProperties($tr["src_id"]);
	$dest = $acc->getProperties($tr["dest_id"]);

	$user_owner = $u->getOwner($user_id);
	$give = (!is_null($src) && $src["owner"] != $user_owner);

	$person_id = ($give) ? $src["owner"] : $dest["owner"];
	$person_name = $person->getName($person_id);

	$person_acc_id = ($give) ? $tr["src_id"] : $tr["dest_id"];
	$acc = new Account($user_id, TRUE);		// TODO : think how to improve this
	$person_acc = $acc->getProperties($person_acc_id);
	$person_res_balance = $person_acc["balance"];
	$person_balance = $person_res_balance + (($give) ? $tr["amount"] : -$tr["amount"]);

	$acc = new Account($user_id);
	$acc_count = $acc->getCount($trans_id);

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

	$amount_sign = Currency::getSign($tr["curr"]);
	$charge_sign = Currency::getSign($debtAcc["curr"]);

	$exchSign = $debtAcc["sign"]."/".$debtAcc["sign"];

	$exchValue = round($tr["amount"] / $tr["charge"], 5);

	$rtAmount = Currency::format($tr["amount"], $amountCurr);
	$rtCharge = Currency::format(0, $chargeCurr);
	$rtExchange = $exchValue." ".$exchSign;
	$rtSrcResBal = Currency::format($person_res_balance, $amountCurr);
	$rtDestResBal = Currency::format($debtAcc["balance"], $debtAcc["curr"]);

	$dateFmt = date("d.m.Y", strtotime($tr["date"]));

	$titleString = "Jezve Money | Edit debt";

	$cssArr = array("common.css", "transaction.css", "tiles.css", "iconlink.css", "ddlist.css", "calendar.css", "popup.css");
	$jsArr = array("common.js", "currency.js", "account.js", "ready.js", "calendar.js", "ddlist.js", "popup.js", "transaction.js", "transaction_layout.js");

	include("./templates/editdebt.tpl");
?>