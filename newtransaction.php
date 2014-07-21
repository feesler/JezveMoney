<?php
	require_once("./setup.php");


	function fail()
	{
		setLocation("./index.php?newtrans=fail");
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

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

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

	$acc_count = $acc->getCount();

	// set source and destination accounts
	$src_id = 0;
	$dest_id = 0;
	if ($trans_type == 1 || $trans_type == 3)			// expense or transfer
		$src_id = ($acc_id ? $acc_id : $acc->getIdByPos(0));
	else if ($trans_type == 2)		// income
		$dest_id = ($acc_id ? $acc_id : $acc->getIdByPos(0));

	if ($trans_type == 3)
		$dest_id = getAnotherAccount($src_id);

	$src = getAccountProperties($src_id);
	$dest = getAccountProperties($dest_id);

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

	$currArr = Currency::getArray(TRUE);

	$onFormSubmit = "return ".(($trans_type == 3) ? "onTransferSubmit" : "onSubmit")."(this);";

	if ($trans_type == 1 || $trans_type == 3)
	{
		$srcBalTitle = "Result balance";
		if ($trans_type == 3)
			$srcBalTitle .= " (Source)";
		$src["balfmt"] = Currency::format($src["balance"], $src["curr"]);
	}

	if ($trans_type == 2 || $trans_type == 3)
	{
		$destBalTitle = "Result balance";
		if ($trans_type == 3)
			$destBalTitle .= " (Destination)";
		$dest["balfmt"] = Currency::format($dest["balance"], $dest["curr"]);
	}

	$transCurr = (($trans_type == 1) ? $src["curr"] : $dest["curr"]);
	$transAccCurr = (($trans_type == 1) ? $src["curr"] : $dest["curr"]);

	$amountSign = (($trans_type == 1) ? $src["sign"] : $dest["sign"]);
	$amountCurr = (($trans_type == 2) ? $dest["curr"] : $src["curr"]);
	$chargeSign = $src["sign"];

	$exchSign = $src["sign"]."/".$dest["sign"];

	$rtAmount = Currency::format(0, ($trans_type == 1) ? $src["curr"] : $dest["curr"]);
	$rtCharge = Currency::format(0, ($trans_type == 1) ? $src["curr"] : $dest["curr"]);
	$rtExchange = "1 ".$src["sign"]."/".$dest["sign"];
	$rtSrcResBal = $src["balfmt"];
	$rtDestResBal = $dest["balfmt"];

	$today = date("d.m.Y");

	$titleString = "Jezve Money | New transaction";


	$cssArr = array("common.css", "transaction.css", "tiles.css", "iconlink.css", "ddlist.css", "calendar.css");
	$jsArr = array("common.js", "currency.js", "account.js", "main.js", "ready.js", "calendar.js", "ddlist.js", "transaction.js", "transaction_layout.js");

	include("./templates/newtransaction.tpl");
?>