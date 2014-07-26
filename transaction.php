<?php
	require_once("./setup.php");


	function fail($msg = NULL)
	{
		if (!is_null($msg))
			setMessage($msg);
		setLocation("./index.php");
	}


	checkUser();

	// Check action
	if (isset($_GET["act"]))
		$action = $_GET["act"];
	else
		$action = "new";
	if ($action != "new" && $action != "edit")
		fail();

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

if ($action == "new")
{
	// check predefined type of transaction
	$type_str = (isset($_GET["type"])) ? $_GET["type"] : "expense";
	$trans_type = Transaction::getStringType($type_str);
	if (!$trans_type)
	{
		$type_str = "expense";
		$trans_type = Transaction::getStringType($type_str);
	}
	if (!$trans_type)
		fail();

	// check predefined account
	$acc_id = 0;
	if (isset($_GET["acc_id"]))
		$acc_id = intval($_GET["acc_id"]);

	if ($trans_type == 4)
	{
		$newDebtLocation = "./newdebt.php";
		if (!$acc_id || !$acc->is_exist($acc_id))
			$newDebtLocation .= "?acc_id=".$acc_id;
		setLocation($newDebtLocation);
	}


	if (!$acc_id || !$acc->is_exist($acc_id))		// TODO : think about redirect or warning message
		$acc_id = $acc->getIdByPos(0);
	if (!$acc_id)
		fail();

	// set source and destination accounts
	$src_id = 0;
	$dest_id = 0;
	if ($trans_type == 1 || $trans_type == 3)			// expense or transfer
		$src_id = ($acc_id ? $acc_id : $acc->getIdByPos(0));
	else if ($trans_type == 2)		// income
		$dest_id = ($acc_id ? $acc_id : $acc->getIdByPos(0));

	if ($trans_type == 3)
		$dest_id = $acc->getAnother($src_id);

	$tr = array("src_id" => $src_id,
				"dest_id" => $dest_id,
				"amount" => 0,
				"charge" => 0,
				"curr" => $acc->getCurrency($acc_id),
				"type" => $trans_type,
				"comment" => "");

}
else
{
	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
		fail(ERR_TRANS_UPDATE);

	$trans_id = intval($_GET["id"]);

	if (!$trans->is_exist($trans_id))
		fail(ERR_TRANS_UPDATE);

	$tr = $trans->getProperties($trans_id);
	$trans_type = $tr["type"];			// TODO : temporarily

	if ($trans_type == 4)
		setLocation("./editdebt.php?id=".$trans_id);
}

	$acc_count = $acc->getCount();

	// get information about source and destination accounts
	$src = $acc->getProperties($tr["src_id"]);
	$dest = $acc->getProperties($tr["dest_id"]);

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
	$transMenu[] = array(($ind + 2), "Debt", urlJoin("./newdebt.php", $params));

	$currArr = Currency::getArray(TRUE);
	$accArr = $acc->getArray();

	$onFormSubmit = "return ".(($trans_type == 3) ? "onTransferSubmit" : "onSubmit")."(this);";

	if ($trans_type == 1 || $trans_type == 3)
	{
		$srcBalTitle = "Result balance";
		if ($trans_type == 3)
			$srcBalTitle .= " (Source)";
		$balDiff = $tr["charge"];
		$src["balfmt"] = Currency::format($src["balance"] + $balDiff, $src["curr"]);
	}

	if ($trans_type == 2 || $trans_type == 3)
	{
		$destBalTitle = "Result balance";
		if ($trans_type == 3)
			$destBalTitle .= " (Destination)";

		if ($trans_type == 2)		// income or person give to us
			$balDiff = $tr["charge"];
		else
			$balDiff = $tr["amount"];
		$dest["balfmt"] = Currency::format($dest["balance"] - $balDiff, $dest["curr"]);
	}

	$transAcc_id = 0;		// main transaction account id
	$transAccCurr = 0;		// currency of transaction account
if ($action == "new")
{
	$transCurr = (($trans_type == 1) ? $src["curr"] : $dest["curr"]);
	$transAccCurr = (($trans_type == 1) ? $src["curr"] : $dest["curr"]);

	$amountSign = (($trans_type == 1) ? $src["sign"] : $dest["sign"]);
	$amountCurr = (($trans_type == 2) ? $dest["curr"] : $src["curr"]);
	$chargeSign = $src["sign"];
}
else
{
	if ((($trans_type == 1 && $tr["dest_id"] == 0) || ($trans_type == 3 && $tr["dest_id"] != 0)) && $tr["src_id"] != 0)
		$transAcc_id = $tr["src_id"];
	else if ($trans_type == 2 && $tr["dest_id"] != 0 && $tr["src_id"] == 0)
		$transAcc_id = $tr["dest_id"];

	$transAccCurr = $acc->getCurrency($transAcc_id);

	$amountSign = Currency::getSign($tr["curr"]);
	$amountCurr = $tr["curr"];
	$chargeSign = Currency::getSign($transAccCurr);
}

	$exchSign = $chargeSign."/".$amountSign;
	$exchValue = ($action == "edit") ? round($tr["amount"] / $tr["charge"], 5) : 1;

	$rtAmount = Currency::format($tr["amount"], ($trans_type == 1) ? $src["curr"] : $dest["curr"]);
	$rtCharge = Currency::format($tr["charge"], ($trans_type == 1) ? $src["curr"] : $dest["curr"]);
	$rtExchange = $exchValue." ".$exchSign;
	$rtSrcResBal = Currency::format($src["balance"], $src["curr"]);
	$rtDestResBal = Currency::format($dest["balance"], $dest["curr"]);

	$dateFmt = ($action == "edit") ? date("d.m.Y", strtotime($tr["date"])) : date("d.m.Y");

	$titleString = "Jezve Money | ";
	$headString = ($action == "new") ? "New transaction" : "Edit transaction";
	$titleString .= $headString;

	$cssArr = array("common.css", "transaction.css", "tiles.css", "iconlink.css", "ddlist.css", "calendar.css");
	$jsArr = array("common.js", "currency.js", "account.js", "ready.js", "calendar.js", "ddlist.js", "transaction.js", "transaction_layout.js");
	if ($action == "edit")
	{
		$cssArr[] = "popup.css";
		$jsArr[] = "popup.js";
	}

	include("./templates/transaction.tpl");
?>