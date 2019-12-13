<?php

class StatisticsController extends Controller
{
	public function index()
	{
		$transMod = TransactionModel::getInstance();
		$accMod = AccountModel::getInstance();
		$currMod = CurrencyModel::getInstance();
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
				$curr_id = $currMod->getIdByPos(0);
				if (!$curr_id)
					$this->fail();
			}
			$filterObj->curr_id = $curr_id;

			$acc_id = NULL;
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

			$curr_id = NULL;
		}

		// Prepare transaction types menu
		$trTypes = ["All", "Expense", "Income", "Transfer", "Debt"];
		$transMenu = [];
		$baseUrl = BASEURL."statistics/";
		foreach($trTypes as $ind => $trTypeName)
		{
			$params = ["type" => strtolower($trTypeName)];
			if ($byCurrency)
			{
				if ($curr_id)
					$params["curr_id"] = $curr_id;
			}
			else
			{
				if ($acc_id)
					$params["acc_id"] = $acc_id;
			}

			$transMenu[] = [$ind, $trTypeName, urlJoin($baseUrl, $params)];
		}

		$byCurrArr = [["title" => "Accounts", "selected" => ($byCurrency == FALSE)],
							["title" => "Currencies", "selected" => ($byCurrency == TRUE)]];

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

		$groupTypes = ["None", "Day", "Week", "Month", "Year"];

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

		$accArr = $accMod->getData();

		$currArr = $currMod->getData();
		$accObj = $accMod->getItem($acc_id);
		if ($byCurrency)
			$accCurr = $curr_id;
		else
			$accCurr = ($accObj) ? $accObj->curr_id : 0;

		$transArr = $transMod->getData($trans_type, $acc_id, TRUE, 10, 0, NULL, $stDate, $endDate);

		$statArr = getStatArray($this->user_id, $byCurrency, ($byCurrency ? $filterObj->curr_id : $filterObj->acc_id), $trans_type, $groupType_id);

		$titleString = "Jezve Money | Statistics";

		array_push($this->css->libs, "iconlink.css", "ddlist.css", "calendar.css", "charts.css");
		$this->css->page[] = "statistics.css";
		$this->buildCSS();
		array_push($this->jsArr, "selection.js", "currency.js", "calendar.js", "ddlist.js", "lib/raphael.min.js", "charts.js", "statistics.js");

		include("./view/templates/statistics.tpl");
	}


	function fail()
	{
		setLocation(BASEURL);
	}
}
