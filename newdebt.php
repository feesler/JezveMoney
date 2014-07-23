<?php
	require_once("./setup.php");


	function fail()
	{
		setLocation("./index.php?newdebt=fail");
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

	$trans_type = 4;
	$give = TRUE;

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);
	$debt = new Debt($user_id);
	$person = new Person($user_id);

	// check predefined account
	$acc_id = 0;
	if (isset($_GET["acc_id"]))
		$acc_id = intval($_GET["acc_id"]);
	if (!$acc_id || !$acc->is_exist($acc_id))		// TODO : think about redirect or warning message
		$acc_id = $acc->getIdByPos(0);
	if (!$acc_id)
		fail();
	$debtAcc = getAccountProperties($acc_id);
	$acc_count = $acc->getCount();


	$fperson_id = $person->getIdByPos(0);
	$fperson_name = $person->getName($fperson_id);

	$fperson_acc = $person->getAccount($fperson_id, $debtAcc["curr"]);
	$acc = new Account($user_id, TRUE);		// TODO : think how to improve this
	$fperson_balance = $fperson_acc ? $acc->getBalance($fperson_acc) : 0.0;
	$acc = new Account($user_id);

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

	if ($give)
		$accLbl = "Destination account";
	else
		$accLbl = "Source account";

	$debtAcc["balfmt"] = Currency::format($debtAcc["balance"], $debtAcc["curr"]);

	$fp_balfmt = Currency::format($fperson_balance, $debtAcc["curr"]);

	$amountSign = $debtAcc["sign"];
	$chargeSign = $debtAcc["sign"];
	$exchSign = $debtAcc["sign"]."/".$debtAcc["sign"];

	$rtAmount = Currency::format(0, $debtAcc["curr"]);
	$rtCharge = Currency::format(0, $debtAcc["curr"]);
	$rtExchange = "1 ".$debtAcc["sign"]."/".$debtAcc["sign"];
	$rtSrcResBal = $fp_balfmt;
	$rtDestResBal = $debtAcc["balfmt"];

	$today = date("d.m.Y");

	$titleString = "Jezve Money | New debt";

	$cssArr = array("common.css", "transaction.css", "tiles.css", "iconlink.css", "ddlist.css", "calendar.css");
	$jsArr = array("common.js", "currency.js", "account.js", "main.js", "ready.js", "calendar.js", "ddlist.js", "transaction.js", "transaction_layout.js");

	include("./templates/newdebt.tpl");
?>