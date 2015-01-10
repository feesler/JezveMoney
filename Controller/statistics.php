<?php

class StatisticsController extends Controller
{
	public function index()
	{
		global $u, $user_name, $user_id;

		$trans = new Transaction($user_id);
		$acc = new Account($user_id);
		$curr = new Currency();

		$byCurrency = (isset($_GET["filter"]) && $_GET["filter"] == "currency");

		$type_str = (isset($_GET["type"])) ? $_GET["type"] : "expense";

		$trans_type = Transaction::getStringType($type_str);
		if (is_null($trans_type))
			$this->fail();

		if ($byCurrency)
		{
			if (isset($_GET["curr_id"]) && is_numeric($_GET["curr_id"]))
			{
				$curr_id = intval($_GET["curr_id"]);
				if (!$curr->is_exist($curr_id))
					$this->fail();
			}
			else		// try to get first currency
			{
				$curr_id = Currency::getIdByPos(0);
				if (!$curr_id)
					$this->fail();
			}
			$curr_acc_id = $curr_id;
		}
		else
		{
			if (isset($_GET["acc_id"]) && is_numeric($_GET["acc_id"]))
			{
				$acc_id = intval($_GET["acc_id"]);
				if (!$acc->is_exist($acc_id))
					$this->fail();
			}
			else		// try to get first account of user
			{
				$acc_id = $acc->getIdByPos(0);
				if (!$acc_id)
					$this->fail();
			}
			$curr_acc_id = $acc_id;
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
				$groupType = strtolower($groupTypes[$groupType_id]);
		}

		$accArr = $acc->getArray();

		$currArr = Currency::getArray(TRUE);
		$accCurr = (($byCurrency) ? $curr_id : $acc->getCurrency($acc_id));
		$transArr = $trans->getArray($trans_type, $acc_id, TRUE, 10, $page_num, $searchReq, $stDate, $endDate);

		$statArr = getStatArray($user_id, $byCurrency, $curr_acc_id, $trans_type, $groupType_id);

		$titleString = "Jezve Money | Statistics";

		$cssArr = array("common.css", "iconlink.css", "ddlist.css", "popup.css", "calendar.css", "statistics.css");
		$jsArr = array("es5-shim.min.js", "common.js", "app.js", "currency.js", "calendar.js", "ddlist.js", "raphael.min.js", "charts.js", "statistics.js");

		include("./view/templates/statistics.tpl");
	}


	function fail()
	{
		setLocation(BASEURL);
	}
}
