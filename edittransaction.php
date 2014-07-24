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
	$src = $acc->getProperties($tr["src_id"]);
	$dest = $acc->getProperties($tr["dest_id"]);

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

	$accArr = $acc->getArray();

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