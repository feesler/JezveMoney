<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\TransactionModel;

class Statistics extends TemplateController
{
    public function index()
    {
        $transMod = TransactionModel::getInstance();
        $accMod = AccountModel::getInstance();
        $currMod = CurrencyModel::getInstance();
        $filterObj = new \stdClass();

        $byCurrency = (isset($_GET["filter"]) && $_GET["filter"] == "currency");
        $filterObj->filter = $byCurrency ? "currency" : "account";

        $trans_type = EXPENSE;
        if (isset($_GET["type"])) {
            $trans_type = TransactionModel::stringToType($_GET["type"]);
            if (!$trans_type) {
                $this->fail("Invalid transaction type");
            }
        }

        if ($trans_type) {
            $filterObj->type = TransactionModel::typeToString($trans_type);
        }

        if ($byCurrency) {
            if (isset($_GET["curr_id"]) && is_numeric($_GET["curr_id"])) {
                $curr_id = intval($_GET["curr_id"]);
                if (!$currMod->is_exist($curr_id)) {
                    $this->fail();
                }
            } else {        // try to get first currency
                $curr_id = $currMod->getIdByPos(0);
                if (!$curr_id) {
                    $this->fail();
                }
            }
            $filterObj->curr_id = $curr_id;

            $acc_id = null;
        } else {
            if (isset($_GET["acc_id"]) && is_numeric($_GET["acc_id"])) {
                $acc_id = intval($_GET["acc_id"]);
                if (!$accMod->is_exist($acc_id)) {
                    $this->fail();
                }
            } else {    /* try to get first account of user */
                $acc_id = $accMod->getIdByPos(0);
                if (!$acc_id) {
                    $this->fail();
                }
            }
            $filterObj->acc_id = $acc_id;

            $curr_id = null;
        }

        // Prepare transaction types menu
        $trTypes = TransactionModel::getTypeNames();

        $params = [];
        if ($byCurrency) {
            if ($curr_id) {
                $params["curr_id"] = $curr_id;
            }
        } else {
            if ($acc_id) {
                $params["acc_id"] = $acc_id;
            }
        }

        $transMenu = [];
        $baseUrl = BASEURL . "statistics/";
        foreach ($trTypes as $type_id => $trTypeName) {
            if ($type_id) {
                $params["type"] = strtolower($trTypeName);
            }

            $menuItem = new \stdClass();
            $menuItem->type = $type_id;
            $menuItem->title = $trTypeName;
            $menuItem->selected = ($menuItem->type == $trans_type);
            $menuItem->link = urlJoin($baseUrl, $params);

            $transMenu[] = $menuItem;
        }

        $byCurrArr = [
            ["title" => "Accounts", "selected" => ($byCurrency == false)],
            ["title" => "Currencies", "selected" => ($byCurrency == true)]
        ];

        $stDate = (isset($_GET["stdate"]) ? $_GET["stdate"] : null);
        $endDate = (isset($_GET["enddate"]) ? $_GET["enddate"] : null);

        $dateFmt = "";
        if (!is_null($stDate) && !is_null($endDate)) {
            $sdate = strtotime($stDate);
            $edate = strtotime($endDate);
            if ($sdate != -1 && $edate != -1) {
                $dateFmt = date("d.m.Y", $sdate) . " - " . date("d.m.Y", $edate);
            }

            $filterObj->stdate = $stDate;
            $filterObj->enddate = $endDate;
        }

        $groupTypes = ["None", "Day", "Week", "Month", "Year"];

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

                $filterObj->group = $groupType;
            }
        }

        $accArr = $accMod->getData();
        $currArr = $currMod->getData();
        $accObj = $accMod->getItem($acc_id);

        if ($byCurrency) {
            $accCurr = $curr_id;
        } else {
            $accCurr = ($accObj) ? $accObj->curr_id : 0;
        }

        $statArr = $transMod->getHistogramSeries(
            $byCurrency,
            ($byCurrency ? $filterObj->curr_id : $filterObj->acc_id),
            $trans_type,
            $groupType_id
        );

        $titleString = "Jezve Money | Statistics";

        array_push($this->css->libs,
            "iconlink.css",
            "dropdown.css",
            "datepicker.css",
            "charts.css"
        );
        $this->css->page[] = "statistics.css";
        $this->buildCSS();

        array_push($this->jsArr,
            "model/list.js",
            "model/currency.js",
            "selection.js",
            "datepicker.js",
            "dropdown.js",
            "lib/raphael.min.js",
            "charts.js",
            "component/iconlink.js",
            "view.js",
            "statisticsview.js"
        );

        include(TPL_PATH . "statistics.tpl");
    }


    protected function fail($msg = null)
    {
        if (!is_null($msg)) {
            Message::set($msg);
        }

        setLocation(BASEURL);
    }
}
