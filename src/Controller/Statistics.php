<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CategoryModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\TransactionModel;

/**
 * Statistics controller
 */
class Statistics extends TemplateController
{
    /**
     * /statistics/ route handler
     * Renders statistics view
     */
    public function index()
    {
        $this->template = new Template(VIEW_TPL_PATH . "Statistics.tpl");
        $data = [];

        $transMod = TransactionModel::getInstance();
        $catMod = CategoryModel::getInstance();
        $accMod = AccountModel::getInstance();
        $currMod = CurrencyModel::getInstance();

        $filterObj = $transMod->getHistogramFilters($_GET);
        $selectedReport = $filterObj->report;
        $data["report"] = $selectedReport;

        $groupTypes = TransactionModel::getHistogramGroupTypes();

        if ($selectedReport === "currency") {
            $accCurr = $filterObj->curr_id;
        } else {
            $accounts = $filterObj->accounts ?? null;
            $account = (is_array($accounts) && count($accounts) > 0)
                ? $accMod->getItem($accounts[0])
                : null;

            $accCurr = ($account) ? $account->curr_id : $currMod->getIdByPos(0);
            if (!$accCurr) {
                throw new \Error(__("currencies.errors.noCurrencies"));
            }
        }

        $data["titleString"] = __("appName") . " | " . __("statistics.title");

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "currency" => $currMod->getData(),
            "accounts" => $accMod->getData(["visibility" => "all"]),
            "categories" => $catMod->getData(),
            "view" => [
                "chartCurrency" => $accCurr,
                "groupTypes" => $groupTypes,
                "filter" => $filterObj,
            ],
        ];

        $this->initResources("StatisticsView");
        $this->render($data);
    }

    /**
     * Controller error handler
     *
     * @param string|null $msg message string
     */
    protected function fail(?string $msg = null)
    {
        if (!is_null($msg)) {
            Message::setError($msg);
        }

        setLocation(BASEURL);
    }
}
