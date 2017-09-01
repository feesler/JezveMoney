<?php

class StatisticsController extends Controller
{
	public function index()
	{
		global $user_name, $user_id;

		$transMod = new TransactionModel($user_id);
		$accMod = new AccountModel($user_id);
		$currMod = new CurrencyModel();
		$filterObj = new stdClass;

		$byCurrency = (isset($_GET["filter"]) && $_GET["filter"] == "currency");
		$filterObj->filter = $byCurrency ? "currency" : "account";

		$type_str = (isset($_GET["type"])) ? $_GET["type"] : "expense";

		$trans_type = TransactionModel::getStringType($type_str);
		if (is_null($trans_type))
			$this->fail();

		$filterObj->type = $type_str;

		if ($byCurrency)
		{
			if (isset($_GET["curr_id"]) && is_numeric($_GET["curr_id"]))
			{
				$curr_id = intval($_GET["curr_id"]);
				if (!$currMod->is_exist($curr_id))
					$this->fail();
			}
			else		// try to get first currency
			{
				$curr_id = CurrencyModel::getIdByPos(0);
				if (!$curr_id)
					$this->fail();
			}
			$filterObj->curr_id = $curr_id;
		}
		else
		{
			if (isset($_GET["acc_id"]) && is_numeric($_GET["acc_id"]))
			{
				$acc_id = intval($_GET["acc_id"]);
				if (!$accMod->is_exist($acc_id))
					$this->fail();
			}
			else		// try to get first account of user
			{
				$acc_id = $accMod->getIdByPos(0);
				if (!$acc_id)
					$this->fail();
			}
			$filterObj->acc_id = $acc_id;
		}

		// Prepare transaction types menu
		$trTypes = array("All", "Expense", "Income", "Transfer", "Debt");
		$transMenu = array();
		$baseUrl = BASEURL."statistics/";
		foreach($trTypes as $ind => $trTypeName)
		{
			$params = array("type" => strtolower($trTypeName));
			if ($acc_id != 0)
				$params["acc_id"] = $acc_id;

			$transMenu[] = array($ind, $trTypeName, urlJoin($baseUrl, $params));
		}

		$byCurrArr = array(array("title" => "Accounts", "selected" => ($byCurrency == FALSE)),
							array("title" => "Currencies", "selected" => ($byCurrency == TRUE)));

		$stDate = (isset($_GET["stdate"]) ? $_GET["stdate"] : NULL);
		$endDate = (isset($_GET["enddate"]) ? $_GET["enddate"] : NULL);

		$dateFmt = "";
		if (!is_null($stDate) && !is_null($endDate))
		{
			$sdate = strtotime($stDate);
			$edate = strtotime($endDate);
			if ($sdate != -1 && $edate != -1)
				$dateFmt = date("d.m.Y", $sdate)." - ".date("d.m.Y", $edate);

			$filterObj->stdate = $stDate;
			$filterObj->enddate = $endDate;
		}

		$groupTypes = array("None", "Day", "Week", "Month", "Year");

		$groupType = NULL;
		$groupType_id = 0;
		if (isset($_GET["group"]))
		{
			foreach($groupTypes as $val => $grtype)
			{
				if (strtolower($_GET["group"]) == strtolower($grtype))
				{
					$groupType_id = $val;
					break;
				}
			}

			if ($groupType_id != 0)
			{
				$groupType = strtolower($groupTypes[$groupType_id]);

				$filterObj->group = $groupType;
			}
		}

		$accArr = $accMod->getArray();

		$currArr = CurrencyModel::getArray();
		$accCurr = (($byCurrency) ? $curr_id : $accMod->getCurrency($acc_id));
		$transArr = $transMod->getArray($trans_type, $acc_id, TRUE, 10, $page_num, $searchReq, $stDate, $endDate);

		$statArr = getStatArray($user_id, $byCurrency, ($byCurrency ? $filterObj->curr_id : $filterObj->acc_id), $trans_type, $groupType_id);

		$titleString = "Jezve Money | Statistics";

		$this->css->libs = array("iconlink.css", "ddlist.css", "popup.css", "calendar.css", "charts.css");
		$this->css->page[] = "statistics.css";
		$this->buildCSS();
		array_push($this->jsArr, "selection.js", "currency.js", "calendar.js", "ddlist.js", "raphael.min.js", "charts.js", "statistics.js");

		include("./view/templates/statistics.tpl");
	}


	function fail()
	{
		setLocation(BASEURL);
	}
}
