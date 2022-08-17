<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\TransactionModel;

class Statistics extends TemplateController
{
    public function index()
    {
        $this->template = new Template(TPL_PATH . "statistics.tpl");
        $data = [];
        $params = [];

        $transMod = TransactionModel::getInstance();
        $accMod = AccountModel::getInstance();
        $currMod = CurrencyModel::getInstance();
        $filterObj = new \stdClass();

        $byCurrency = (isset($_GET["filter"]) && $_GET["filter"] == "currency");
        $data["byCurrency"] = $byCurrency;
        $params["filter"] = $byCurrency ? "currency" : "account";
        $filterObj->filter = $params["filter"];

        $trans_type = EXPENSE;
        if (isset($_GET["type"])) {
            $trans_type = TransactionModel::stringToType($_GET["type"]);
            if (!$trans_type) {
                $this->fail("Invalid transaction type");
            }
        }

        $params["type"] = $trans_type;
        $filterObj->type = TransactionModel::typeToString($trans_type);

        if ($byCurrency) {
            if (isset($_GET["curr_id"]) && is_numeric($_GET["curr_id"])) {
                $curr_id = intval($_GET["curr_id"]);
                if (!$currMod->isExist($curr_id)) {
                    $this->fail();
                }
            } else {        // try to get first currency
                $curr_id = $currMod->getIdByPos(0);
                if (!$curr_id) {
                    $this->fail();
                }
            }
            $params["curr_id"] = $curr_id;
            $filterObj->curr_id = $curr_id;

            $acc_id = null;
        } else {
            if (isset($_GET["acc_id"]) && is_numeric($_GET["acc_id"])) {
                $acc_id = intval($_GET["acc_id"]);
                if (!$accMod->isExist($acc_id)) {
                    $this->fail();
                }
            } else {    /* try to get first account of user */
                $acc_id = $accMod->getIdByPos(0);
                if (!$acc_id) {
                    $this->fail();
                }
            }
            $params["acc_id"] = $acc_id;
            $filterObj->acc_id = $acc_id;

            $curr_id = null;
        }
        $data["acc_id"] = $acc_id;
        $data["curr_id"] = $curr_id;

        $data["byCurrArr"] = [
            ["title" => "Accounts", "selected" => ($byCurrency == false)],
            ["title" => "Currencies", "selected" => ($byCurrency == true)]
        ];

        $dateFmt = "";
        $stDate = (isset($_GET["stdate"]) ? $_GET["stdate"] : null);
        $endDate = (isset($_GET["enddate"]) ? $_GET["enddate"] : null);
        if (!is_null($stDate) && !is_null($endDate)) {
            $sdate = strtotime($stDate);
            $edate = strtotime($endDate);
            if ($sdate != -1 && $edate != -1) {
                $dateFmt = date("d.m.Y", $sdate) . " - " . date("d.m.Y", $edate);
            }

            $params["startDate"] = $stDate;
            $params["endDate"] = $endDate;
            $filterObj->stdate = $stDate;
            $filterObj->enddate = $endDate;
        }
        $data["dateFmt"] = $dateFmt;

        $groupTypes = ["None", "Day", "Week", "Month", "Year"];
        $data["groupTypes"] = $groupTypes;

        $groupType = null;
        $groupType_id = 0;
        if (isset($_GET["group"])) {
            foreach ($groupTypes as $val => $grtype) {
                if (strtolower($_GET["group"]) == strtolower($grtype)) {
                    $groupType_id = $val;
                    break;
                }
            }

            if ($groupType_id != 0) {
                $groupType = strtolower($groupTypes[$groupType_id]);

                $params["group"] = $groupType_id;
                $filterObj->group = $groupType;
            }
        }
        $data["groupType_id"] = $groupType_id;

        // Prepare transaction types menu
        $trTypes = TransactionModel::getTypeNames();

        $urlParams = [];
        if ($byCurrency) {
            $urlParams["filter"] = "currency";
            if ($curr_id) {
                $urlParams["curr_id"] = $curr_id;
            }
        } else {
            if ($acc_id) {
                $urlParams["acc_id"] = $acc_id;
            }
        }
        if ($groupType_id) {
            $urlParams["group"] = $filterObj->group;
        }

        $transMenu = [];
        $baseUrl = BASEURL . "statistics/";
        foreach ($trTypes as $type_id => $trTypeName) {
            $searchParams = $urlParams;
            if ($type_id) {
                $searchParams["type"] = strtolower($trTypeName);
            }

            $menuItem = new \stdClass();
            $menuItem->type = $type_id;
            $menuItem->title = $trTypeName;
            $menuItem->selected = ($menuItem->type == $trans_type);
            $menuItem->url = urlJoin($baseUrl, $searchParams);

            $transMenu[] = $menuItem;
        }
        $data["transMenu"] = $transMenu;

        $data["accArr"] = $accMod->getData();
        $data["currArr"] = $currMod->getData();
        $accObj = $accMod->getItem($acc_id);

        if ($byCurrency) {
            $accCurr = $curr_id;
        } else {
            $accCurr = ($accObj) ? $accObj->curr_id : 0;
        }

        $statArr = $transMod->getHistogramSeries($params);
        $data["statArr"] = $statArr;

        $data["titleString"] = "Jezve Money | Statistics";

        $data["appProps"] = [
            "currency" => $data["currArr"],
            "view" => [
                "accountCurrency" => $accCurr,
                "filter" => $filterObj,
                "chartData" => $statArr,
            ],
        ];

        $this->cssArr[] = "StatisticsView.css";
        $this->jsArr[] = "StatisticsView.js";

        $this->render($data);
    }


    protected function fail($msg = null)
    {
        if (!is_null($msg)) {
            Message::set($msg);
        }

        setLocation(BASEURL);
    }
}
