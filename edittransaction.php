<?php
	require_once("./setup.php");


	function fail()
	{
		setMessage(ERR_TRANS_UPDATE);
		setLocation("./index.php");
	}


	// Build array with properties of transaction
	function getTransProperties($trans_id)
	{
		global $db, $user_id;

		$resArr = array();

		$qRes = $db->selectQ("*", "transactions", "id=".$trans_id." AND user_id=".$user_id);

		if (count($qRes) != 1)
			return $resArr;

		$row = $qRes[0];
		$resArr["id"] = $trans_id;
		$resArr["src_id"] = intval($row["src_id"]);
		$resArr["dest_id"] = intval($row["dest_id"]);
		$resArr["type"] = intval($row["type"]);
		$resArr["curr"] = intval($row["curr_id"]);
		$resArr["amount"] = floatval($row["amount"]);
		$resArr["charge"] = floatval($row["charge"]);
		$resArr["date"] = $row["date"];
		$resArr["comment"] = $row["comment"];

		return $resArr;
	}


	// Build array with some account properties
	function getAccountProperties($acc_id)
	{
		global $acc;

		if (!$acc_id || !is_numeric($acc_id))
			return NULL;

		$acc_id = intval($acc_id);

		$resArr = array();
		$resArr["id"] = $acc_id;
		$resArr["name"] = $acc->getName($acc_id);
		$resArr["balance"] = $acc->getBalance($acc_id);
		$resArr["curr"] = $acc->getCurrency($acc_id);
		$resArr["sign"] = Currency::getSign($resArr["curr"]);
		$resArr["icon"] = $acc->getIcon($acc_id);
		$resArr["iconclass"] = $acc->getIconClass($resArr["icon"]);

		return $resArr;
	}


	// Try to find account different from specified
	function getAnotherAccount($acc_id)
	{
		global $acc;

		if ($acc_id != 0 && $acc->getCount() < 2)
			return 0;

		$newacc_id = $acc->getIdByPos(0);
		if ($newacc_id == $acc_id)
			$newacc_id = $acc->getIdByPos(1);

		return $newacc_id;
	}


	checkUser();

	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
		fail();

	$trans_id = intval($_GET["id"]);

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

	if (!$trans->is_exist($trans_id))
		fail();

	$tr = getTransProperties($trans_id);
	$trans_type = $tr["type"];			// TODO : temporarily

	if ($trans_type == 4)
		setLocation("./editdebt.php?id=".$trans_id);

	$acc_count = $acc->getCount($trans_id);

	// get information about source and destination accounts
	$src = getAccountProperties($tr["src_id"]);
	$dest = getAccountProperties($tr["dest_id"]);

	// Prepare transaction types menu
	$trTypes = array("Expense", "Income", "Transfer", "Debt");
	$transMenu = array();
	$baseUrl = "./newtransaction.php";
	foreach($trTypes as $ind => $trTypeName)
	{
		$params = array("type" => strtolower($trTypeName));
		if ($acc_id != 0)
			$params["acc_id"] = $acc_id;

		$transMenu[] = array(($ind + 1), $trTypeName, urlJoin($baseUrl, $params));
	}

	$accArr = $acc->getArray();

	if ($trans_type == 1 || $trans_type == 3)
	{
		$srcBalTitle = "Result balance";
		if ($trans_type == 3)
			$srcBalTitle .= " (Source)";
		$src["iconclass"] = $acc->getIconClass($src["icon"]);
		$balDiff = $tr["charge"];
		$src["balfmt"] = Currency::format($src["balance"] + $balDiff, $src["curr"]);
	}

	if ($trans_type == 2 || $trans_type == 3)
	{
		$destBalTitle = "Result balance";
		if ($trans_type == 3)
			$destBalTitle .= " (Destination)";
		$dest["iconclass"] = $acc->getIconClass($dest["icon"]);

		if ($trans_type == 2)		// income or person give to us
			$balDiff = $tr["charge"];
		else
			$balDiff = $tr["amount"];
		$dest["balfmt"] = Currency::format($dest["balance"] - $balDiff, $dest["curr"]);
	}

	$transAcc_id = 0;		// main transaction account id
	$transAccCur = 0;		// currency of transaction account
	if ((($trans_type == 1 && $tr["dest_id"] == 0) || ($trans_type == 3 && $tr["dest_id"] != 0)) && $tr["src_id"] != 0)
		$transAcc_id = $tr["src_id"];
	else if ($trans_type == 2 && $tr["dest_id"] != 0 && $tr["src_id"] == 0)
		$transAcc_id = $tr["dest_id"];

	$src_curr = $acc->getCurrency($tr["src_id"]);
	$dest_curr = $acc->getCurrency($tr["dest_id"]);
	$transAccCur = $acc->getCurrency($transAcc_id);

	$currArr = Currency::getArray(TRUE);

	$amount_sign = Currency::getSign($tr["curr"]);
	$charge_sign = Currency::getSign($transAccCur);

	$exchSign = $charge_sign."/".$amount_sign;

	$exchValue = round($tr["amount"] / $tr["charge"], 5);

	$rtAmount = Currency::format($tr["amount"], ($trans_type == 1) ? $src["curr"] : $dest["curr"]);
	$rtCharge = Currency::format($tr["charge"], ($trans_type == 1) ? $src["curr"] : $dest["curr"]);
	$rtExchange = $exchValue." ".$exchSign;
	$rtSrcResBal = Currency::format($src["balance"], $src["curr"]);
	$rtDestResBal = Currency::format($dest["balance"], $dest["curr"]);

	$dateFmt = date("d.m.Y", strtotime($tr["date"]));

	$titleString = "Jezve Money | Edit transaction";

	$cssArr = array("common.css", "transaction.css", "tiles.css", "popup.css", "iconlink.css", "ddlist.css", "calendar.css");
	$jsArr = array("common.js", "ready.js", "calendar.js", "popup.js", "currency.js", "account.js", "ddlist.js", "transaction.js", "transaction_layout.js");

	include("./templates/edittransaction.tpl");
?>