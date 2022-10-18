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
        $this->template = new Template(VIEW_TPL_PATH . "Statistics.tpl");
        $data = [];

        $transMod = TransactionModel::getInstance();
        $accMod = AccountModel::getInstance();
        $currMod = CurrencyModel::getInstance();

        $filterObj = $transMod->getHistogramFilters($_GET);

        $byCurrency = ($filterObj->filter == "currency");
        $data["byCurrency"] = $byCurrency;

        $data["byCurrArr"] = [
            ["title" => "Accounts", "selected" => ($byCurrency == false)],
            ["title" => "Currencies", "selected" => ($byCurrency == true)]
        ];

        $dateFmt = "";
        if (isset($filterObj->stdate) && isset($filterObj->enddate)) {
            $sdate = strtotime($filterObj->stdate);
            $edate = strtotime($filterObj->enddate);
            if ($sdate != -1 && $edate != -1) {
                $dateFmt = date("d.m.Y", $sdate) . " - " . date("d.m.Y", $edate);
            }
        }
        $data["dateFmt"] = $dateFmt;

        $groupTypes = TransactionModel::getHistogramGroupNames();
        $data["groupTypes"] = $groupTypes;

        $groupType_id = 0;
        if (isset($filterObj->group)) {
            $groupType_id = TransactionModel::getHistogramGroupTypeByName($filterObj->group);
        }
        $data["groupType_id"] = $groupType_id;

        // Prepare transaction types menu
        $trTypes = TransactionModel::getTypeNames();

        $urlParams = [];
        if ($byCurrency) {
            $urlParams["filter"] = "currency";
            if (isset($filterObj->curr_id)) {
                $urlParams["curr_id"] = $filterObj->curr_id;
            }
        } else {
            if (isset($filterObj->acc_id)) {
                $urlParams["acc_id"] = $filterObj->acc_id;
            }
        }
        if ($groupType_id) {
            $urlParams["group"] = $filterObj->group;
        }
        if (isset($filterObj->stdate) && isset($filterObj->enddate)) {
            $urlParams["stdate"] = $filterObj->stdate;
            $urlParams["enddate"] = $filterObj->enddate;
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
            $menuItem->selected = in_array($menuItem->type, $filterObj->type);
            $menuItem->url = urlJoin($baseUrl, $searchParams);

            $transMenu[] = $menuItem;
        }
        $data["transMenu"] = $transMenu;

        if ($byCurrency) {
            $accCurr = $filterObj->curr_id;
        } else {
            $account = $accMod->getItem($filterObj->acc_id);
            $accCurr = ($account) ? $account->curr_id : 0;
        }

        $data["titleString"] = "Jezve Money | Statistics";

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "currency" => $currMod->getData(),
            "accounts" => $accMod->getData(["type" => "all"]),
            "view" => [
                "accountCurrency" => $accCurr,
                "filter" => $filterObj,
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
