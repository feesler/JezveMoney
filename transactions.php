<?php
	require_once("./system/setup.php");

	checkUser();

	$trans = new Transaction($user_id);
	$acc = new Account($user_id);

	$type_str = (isset($_GET["type"])) ? $_GET["type"] : "all";

	$trans_type = Transaction::getStringType($type_str);
	if (is_null($trans_type))
		fail();

	$page_num = (isset($_GET["page"]) && is_numeric($_GET["page"])) ? (intval($_GET["page"]) - 1) : 0;

	// Prepare array of accounts
	$accFilter = array();
	if (isset($_GET["acc_id"]))
	{
		$accExpl = explode(",", $_GET["acc_id"]);
		foreach($accExpl as $acc_id)
		{
			$acc_id = intval(trim($acc_id));
			if ($acc_id && $acc->is_exist($acc_id))
				$accFilter[] = $acc_id;
		}
	}

/*
	$acc_id = (isset($_GET["acc_id"])) ? intval($_GET["acc_id"]) : 0;
	if ($acc_id && !$acc->is_exist($acc_id))
		$acc_id = 0;
*/

	$searchReq = (isset($_GET["search"]) ? $_GET["search"] : NULL);

	$stDate = (isset($_GET["stdate"]) ? $_GET["stdate"] : NULL);
	$endDate = (isset($_GET["enddate"]) ? $_GET["enddate"] : NULL);

	$dateFmt = "";
	if (!is_null($stDate) && !is_null($endDate))
	{
		$sdate = strtotime($stDate);
		$edate = strtotime($endDate);
		if ($sdate != -1 && $edate != -1)
			$dateFmt = date("d.m.Y", $sdate)." - ".date("d.m.Y", $edate);
	}

	$showDetails = FALSE;
	if (isset($_GET["mode"]) && $_GET["mode"] == "details")
		$showDetails = TRUE;

	$accArr = $acc->getArray();

	$acc = new Account($user_id, TRUE);
	$accounts = $acc->getCount();

	$tr_on_page = 10;

	$totalTrCount = $db->countQ("transactions", "user_id=".$user_id);
	$transArr = ($totalTrCount) ? $trans->getArray($trans_type, $accFilter, TRUE, $tr_on_page, $page_num, $searchReq, $stDate, $endDate, TRUE) : array();
	$transCount = $trans->getTransCount($trans_type, $accFilter, $searchStr, $startDate, $endDate);

	$currArr = Currency::getArray(TRUE);

	// Prepare transaction types menu
	$trTypes = array("All", "Expense", "Income", "Transfer", "Debt");
	$transMenu = array();
	$baseUrl = "./transactions.php";
	foreach($trTypes as $ind => $trTypeName)
	{
		$params = array("type" => strtolower($trTypeName));
		if ($acc_id != 0)
			$params["acc_id"] = $acc_id;
		if ($showDetails)
			$params["mode"] = "details";

		$transMenu[] = array($ind, $trTypeName, urlJoin($baseUrl, $params));
	}

	$showPaginator = TRUE;
	$details = $showDetails;

	// Prepare mode selector and paginator
	if ($showPaginator == TRUE)
	{
		$params = array("type" => $trans->getTypeString($trans_type),
						"mode" => (($details) ? "classic" : "details"));
		if ($acc_id != 0)
			$params["acc_id"] = $acc_id;
		if ($page_num != 0)
			$params["page"] = ($page_num + 1);
		if (!is_empty($searchStr))
			$params["search"] = $searchStr;
		if (!is_empty($startDate) && !is_empty($endDate))
		{
			$params["stdate"] = $startDate;
			$params["enddate"] = $endDate;
		}
		$linkStr = urlJoin("./transactions.php", $params);

		// Build data for paginator
		if ($tr_on_page > 0)
		{
			$pageCount = ceil($transCount / $tr_on_page);
			$pagesArr = ($transCount > $tr_on_page) ? $trans->getPaginatorArray($page_num, $pageCount) : array();
			foreach($pagesArr as $ind => $pageItem)
			{
				if (is_numeric($pageItem["text"]) && !$pageItem["active"])
				{
					$pNum = intval($pageItem["text"]);
					$pagesArr[$ind]["link"] = $trans->getPageLink($trans_type, $acc_id, $pNum, $searchStr, $startDate, $endDate, $details);
				}
			}
		}
	}

	// Prepare data of transaction list items
	$trListData = array();
	foreach($transArr as $trans)
	{
		$trans_id = $trans[0];
		$src_id = $trans[1];
		$dest_id = $trans[2];
		$fSrcAmount = $trans[3];
		$fDestAmount = $trans[4];
		$cur_trans_type = $trans[5];
		$fdate = $trans[6];
		$comment = $trans[7];

		if ($details)
		{
			$src_balance = $trans[9];
			$dest_balance = $trans[10];
		}

		if ($cur_trans_type == 4)
		{
			$src_owner_id = $acc->getOwner($src_id);
			$dest_owner_id = $acc->getOwner($dest_id);
		}

		$itemData = array("id" => $trans_id);

		// Build accounts string
		$accStr = "";
		if ($src_id != 0)
		{
			if ($cur_trans_type == 1 || $cur_trans_type == 3)		// expense or transfer
				$accStr .= $acc->getName($src_id);
			else if ($cur_trans_type == 4)
				$accStr .= $acc->getNameOrPerson($src_id);
		}

		if ($src_id != 0 && $dest_id != 0 && ($cur_trans_type == 3 || $cur_trans_type == 4))
			$accStr .= " → ";

		if ($dest_id != 0)
		{
			if ($cur_trans_type == 2 || $cur_trans_type == 3)		// income or transfer
				$accStr .= $acc->getName($dest_id);
			else if ($cur_trans_type == 4)
				$accStr .= $acc->getNameOrPerson($dest_id);
		}

		$itemData["acc"] = $accStr;

		// Build amount string
		$amStr = $fSrcAmount;
		if ($fSrcAmount != $fDestAmount)
			$amStr .= " (".$fDestAmount.")";
		$itemData["amount"] = $amStr;

		$itemData["date"] = $fdate;
		$itemData["comm"] = $comment;

		if ($details)
		{
			$itemData["balance"] = array();

			if ($cur_trans_type == 1 || $cur_trans_type == 2)
			{
				$tr_acc_id = ($cur_trans_type == 1) ? $src_id : $dest_id;

				$balance = ($cur_trans_type == 1) ? $src_balance : $dest_balance;
				$acc_curr = $acc->getCurrency($tr_acc_id);

				$itemData["balance"][] = Currency::format($balance, $acc_curr);
			}
			else if ($cur_trans_type == 3 || $cur_trans_type == 4)
			{
				if ($src_id != 0)
				{
					$acc_curr = $acc->getCurrency($src_id);

					$itemData["balance"][] = Currency::format($src_balance, $acc_curr);
				}

				if ($dest_id != 0)
				{
					$acc_curr = $acc->getCurrency($dest_id);

					$itemData["balance"][] = Currency::format($dest_balance, $acc_curr);
				}
			}
		}


		$trListData[] = $itemData;
	}

	$titleString = "Jezve Money | Transactions";

	$cssArr = array("common.css", "tiles.css", "iconlink.css", "popup.css", "calendar.css", "ddlist.css", "transaction.css", "trlist.css", "toolbar.css");
	$jsArr = array("es5-shim.min.js", "common.js", "app.js", "currency.js", "account.js", "ajax.js", "ready.js", "calendar.js", "popup.js", "dragndrop.js", "toolbar.js", "ddlist.js", "tr_list.js");

	include("./view/templates/transactions.tpl");
?>