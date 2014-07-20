<?php
	require_once("./setup.php");

	checkUser();

	$trans = new Transaction($user_id);
	$acc = new Account($user_id);

	$type_str = (isset($_GET["type"])) ? $_GET["type"] : "all";

	$trans_type = Transaction::getStringType($type_str);
	if (is_null($trans_type))
		fail();

	$page_num = (isset($_GET["page"]) && is_numeric($_GET["page"])) ? (intval($_GET["page"]) - 1) : 0;

	$acc_id = (isset($_GET["acc_id"])) ? intval($_GET["acc_id"]) : 0;
	if ($acc_id && !$acc->is_exist($acc_id))
		$acc_id = 0;

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
	$transArr = ($totalTrCount) ? $trans->getArray($trans_type, $acc_id, TRUE, $tr_on_page, $page_num, $searchReq, $stDate, $endDate, TRUE) : array();
	$transCount = $trans->getTransCount($trans_type, $acc_id, $searchStr, $startDate, $endDate);

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

		if ($tr_on_page > 0)
		{
			$pageCount = ceil($transCount / $tr_on_page);
			if ($transCount > $tr_on_page)
				$pagesArr = $trans->getPaginatorArray($page_num, $pageCount);
		}
	}


	$titleString = "Jezve Money | Transactions";

	$cssArr = array("common.css", "tiles.css", "iconlink.css", "popup.css", "calendar.css", "ddlist.css", "transaction.css", "trlist.css", "toolbar.css");
	$jsArr = array("common.js", "currency.js", "account.js", "ajax.js", "ready.js", "calendar.js", "popup.js", "dragndrop.js", "toolbar.js", "ddlist.js", "tr_list.js");

	include("./templates/transactions.tpl");
?>