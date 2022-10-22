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

        $byCurrency = ($filterObj->report == "currency");
        $data["byCurrency"] = $byCurrency;

        $reportTypes = [
            ["title" => "Accounts", "value" => "account"],
            ["title" => "Currencies", "value" => "currency"]
        ];

        $data["dateRange"] = [
            "id" => "dateFrm",
            "start" => ($filterObj->stdate ?? null),
            "end" => ($filterObj->enddate ?? null)
        ];

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
            $urlParams["report"] = "currency";
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

        $baseUrl = BASEURL . "statistics/";

        $reportMenu = [];
        $selectedReport = ($byCurrency) ? "currency" : "account";
        foreach ($reportTypes as $type) {
            $searchParams = $urlParams;
            $searchParams["report"] = $type["value"];

            $item = [
                "title" => $type["title"],
                "value" => $type["value"],
                "selected" => ($type["value"] == $selectedReport),
                "url" => urlJoin($baseUrl, $searchParams)
            ];

            $reportMenu[] = $item;
        }
        $data["reportMenu"] = $reportMenu;

        $typeMenu = [];
        foreach ($trTypes as $type_id => $trTypeName) {
            $searchParams = $urlParams;
            if ($type_id) {
                $searchParams["type"] = strtolower($trTypeName);
            }

            $item = [
                "value" => $type_id,
                "title" => $trTypeName,
                "selected" => in_array($type_id, $filterObj->type),
                "url" => urlJoin($baseUrl, $searchParams)
            ];

            $typeMenu[] = $item;
        }
        $data["typeMenu"] = $typeMenu;

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
            "accounts" => $accMod->getData(["visibility" => "all"]),
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
