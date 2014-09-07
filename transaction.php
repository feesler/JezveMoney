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

	if ($action == "new")
		$defMsg = ERR_TRANS_CREATE;
	else if ($action == "edit")
		$defMsg = ERR_TRANS_UPDATE;

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
			fail($defMsg);

		$acc = new Account($user_id, ($trans_type == DEBT));

		// check predefined account
		$acc_id = 0;
		if (isset($_GET["acc_id"]))
			$acc_id = intval($_GET["acc_id"]);
		if (!$acc_id || !$acc->is_exist($acc_id))		// TODO : think about redirect or warning message
			$acc_id = $acc->getIdByPos(0);
		if (!$acc_id)
			fail($defMsg);

		if ($trans_type == DEBT)
		{
			$debt = new Debt($user_id);
			$person = new Person($user_id);

			$debtAcc = $acc->getProperties($acc_id);

			// Prepare person account
			$person_id = $person->getIdByPos(0);
			$person_name = $person->getName($person_id);

			$person_acc_id = $person->getAccount($person_id, $debtAcc["curr"]);
			$person_acc = $acc->getProperties($person_acc_id);
			$person_res_balance = $person_acc ? $person_acc["balance"] : 0.0;
			$person_balance = $person_res_balance;

			$tr = array("src_id" => $person_acc_id, "dest_id" => $acc_id, "src_amount" => 0, "dest_amount" => 0, "src_curr" => $debtAcc["curr"], "dest_curr" => $debtAcc["curr"], "type" => $trans_type, "comment" => "");
			$give = TRUE;
		}
		else
		{
			// set source and destination accounts
			$src_id = 0;
			$dest_id = 0;
			if ($trans_type == EXPENSE || $trans_type == TRANSFER)
				$src_id = ($acc_id ? $acc_id : $acc->getIdByPos(0));
			else if ($trans_type == INCOME)		// income
				$dest_id = ($acc_id ? $acc_id : $acc->getIdByPos(0));

			if ($trans_type == TRANSFER)
				$dest_id = $acc->getAnother($src_id);

			$tr = array("src_id" => $src_id,
						"dest_id" => $dest_id,
						"src_amount" => 0,
						"dest_amount" => 0,
						"src_curr" => ($src_id != 0) ? $acc->getCurrency($src_id) : 0,
						"dest_curr" => ($dest_id != 0) ? $acc->getCurrency($dest_id) : 0,
						"type" => $trans_type,
						"comment" => "");

			if ($trans_type == EXPENSE)
				$tr["dest_curr"] = $tr["src_curr"];
			else if ($trans_type == INCOME)
				$tr["src_curr"] = $tr["dest_curr"];
		}
	}
	else
	{
		if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
			fail($defMsg);

		$trans_id = intval($_GET["id"]);

		if (!$trans->is_exist($trans_id))
			fail($defMsg);

		$tr = $trans->getProperties($trans_id);
		$trans_type = $tr["type"];			// TODO : temporarily

		$acc = new Account($user_id, ($trans_type == DEBT));
		if ($trans_type == DEBT)
		{
			$debt = new Debt($user_id);
			$person = new Person($user_id);
		}
	}

	$acc_count = $acc->getCount();

	if ($trans_type != DEBT)
	{
		// get information about source and destination accounts
		$src = $acc->getProperties($tr["src_id"]);
		$dest = $acc->getProperties($tr["dest_id"]);
	}

	// Prepare transaction types menu
	$trTypes = array("Expense", "Income", "Transfer", "Debt");
	$transMenu = array();
	$baseUrl = "./transaction.php";
	foreach($trTypes as $ind => $trTypeName)
	{
		$params = array("act" => "new", "type" => strtolower($trTypeName));
		if ($acc_id != 0)
			$params["acc_id"] = $acc_id;

		$transMenu[] = array(($ind + 1), $trTypeName, urlJoin($baseUrl, $params));
	}

	$formAction = "./modules/transaction.php?act=".$action;
	if ($action == "new")
		$formAction .= "&type=".$type_str;
	if ($trans_type == DEBT)
	{
		$onFormSubmit = "return onDebtSubmit(this);";
	}
	else
	{
		if ($action == "new")
		{
			$onFormSubmit = "return ".(($trans_type == TRANSFER) ? "onTransferSubmit" : "onSubmit")."(this);";
		}
		else if ($action == "edit")
		{
			$onFormSubmit = "return onEditTransSubmit(this);";
		}
	}

	if ($trans_type == EXPENSE || $trans_type == TRANSFER || $trans_type == DEBT)
	{
		$srcBalTitle = "Result balance";
		if ($trans_type == TRANSFER)
			$srcBalTitle .= " (Source)";
		else if ($trans_type == DEBT)
			$srcBalTitle .= " (Person)";
		$balDiff = $tr["dest_amount"];
		$src["balfmt"] = Currency::format($src["balance"] + $balDiff, $src["curr"]);
	}

	if ($trans_type == INCOME || $trans_type == TRANSFER || $trans_type == DEBT)
	{
		$destBalTitle = "Result balance";
		if ($trans_type == TRANSFER)
			$destBalTitle .= " (Destination)";
		else if ($trans_type == DEBT)
			$destBalTitle .= " (Account)";

		if ($trans_type == INCOME)		// income or person give to us
			$balDiff = $tr["dest_amount"];
		else
			$balDiff = $tr["src_amount"];
		$dest["balfmt"] = Currency::format($dest["balance"] - $balDiff, $dest["curr"]);
	}

	$transAcc_id = 0;		// main transaction account id
	$transAccCurr = 0;		// currency of transaction account
	if ($action == "new")
	{
		if ($trans_type != DEBT)
		{
			$transCurr = (($trans_type == EXPENSE) ? $src["curr"] : $dest["curr"]);
			$transAccCurr = (($trans_type == EXPENSE) ? $src["curr"] : $dest["curr"]);

			$srcAmountCurr = (!is_null($src)) ? $src["curr"] : $dest["curr"];
			$destAmountCurr = (!is_null($dest)) ? $dest["curr"] : $src["curr"];

			// Show destination amount for expense and source amount for income by default because it's amount with changing currency.
			// Meanwhile source amount for expense and destination amount for income always have the same currency as account.
			$showSrcAmount = ($trans_type != EXPENSE);
			if ($trans_type == TRANSFER)
				$showDestAmount = ($srcAmountCurr != $destAmountCurr);
			else
				$showDestAmount = ($trans_type != INCOME);
		}
		else
		{
			$tr["src_id"] = $person_acc_id;

			$noAccount = FALSE;

			$srcAmountCurr = $debtAcc["curr"];
			$destAmountCurr = $debtAcc["curr"];

			$showSrcAmount = TRUE;
			$showDestAmount = FALSE;
		}
	}
	else
	{
		if ($trans_type != DEBT)
		{
			if ((($trans_type == EXPENSE && $tr["dest_id"] == 0) || ($trans_type == TRANSFER && $tr["dest_id"] != 0)) && $tr["src_id"] != 0)
				$transAcc_id = $tr["src_id"];
			else if ($trans_type == INCOME && $tr["dest_id"] != 0 && $tr["src_id"] == 0)
				$transAcc_id = $tr["dest_id"];

			$transAccCurr = $acc->getCurrency($transAcc_id);

			$srcAmountCurr = $tr["src_curr"];
			$destAmountCurr = $tr["dest_curr"];

			$showSrcAmount = ($trans_type != EXPENSE) ? TRUE : ($srcAmountCurr != $destAmountCurr);
			$showDestAmount = ($trans_type != INCOME) ? TRUE : ($srcAmountCurr != $destAmountCurr);
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

			$srcAmountCurr = $tr["curr"];
			if ($noAccount)
			{
				$destAmountCurr = $person_acc["curr"];
				$acc_id = $acc->getIdByPos(0);
				$acc_name = $acc->getName($acc_id);
				$acc_balance = Currency::format($acc->getBalance($acc_id), $acc->getCurrency($acc_id));
				$acc_ic = $acc->getIconClass($acc->getIcon($acc_id));
			}
			else
			{
				$acc_id = 0;
				$destAmountCurr = $debtAcc["curr"];
			}
		}
	}


	// Common arrays
	$currArr = Currency::getArray(TRUE);
	$acc = new Account($user_id);
	$accArr = $acc->getArray();
	if ($trans_type == DEBT)
		$persArr = $person->getArray();

	$srcAmountLbl = ($showSrcAmount && $showDestAmount) ? "Source amount" : "Amount";
	$destAmountLbl = ($showSrcAmount && $showDestAmount) ? "Destination amount" : "Amount";

	if ($trans_type == DEBT)
	{
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

		$debtAcc["balfmt"] = Currency::format($debtAcc["balance"] + $tr["dest_amount"], $debtAcc["curr"]);

		$p_balfmt = Currency::format($person_balance, $srcAmountCurr);
	}

	$srcAmountSign = Currency::getSign($srcAmountCurr);
	$destAmountSign = Currency::getSign($destAmountCurr);
	$exchSign = $destAmountSign."/".$srcAmountSign;
	$exchValue = ($action == "edit") ? round($tr["src_amount"] / $tr["dest_amount"], 5) : 1;

	$rtSrcAmount = Currency::format($tr["src_amount"], $srcAmountCurr);
	$rtDestAmount = Currency::format($tr["dest_amount"], $destAmountCurr);
	$rtExchange = $exchValue." ".$exchSign;
	if ($trans_type != DEBT)
	{
		$rtSrcResBal = Currency::format($src["balance"], $src["curr"]);
		$rtDestResBal = Currency::format($dest["balance"], $dest["curr"]);
	}
	else
	{
		$rtSrcResBal = Currency::format($person_res_balance, $srcAmountCurr);
		$rtDestResBal = Currency::format($debtAcc["balance"], $debtAcc["curr"]);
	}

	$dateFmt = ($action == "edit") ? date("d.m.Y", strtotime($tr["date"])) : date("d.m.Y");

	$titleString = "Jezve Money | ";
	if ($trans_type == DEBT)
		$headString = ($action == "new") ? "New debt" : "Edit debt";
	else
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