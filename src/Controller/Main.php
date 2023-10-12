<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\TransactionModel;
use JezveMoney\App\Model\CategoryModel;
use JezveMoney\App\Model\IconModel;
use JezveMoney\Core\Application;

const DEFAULT_CHART_LIMIT = 5;

/**
 * Main controller
 */
class Main extends TemplateController
{
    /**
     * / route handler
     * Renders main view
     */
    public function index()
    {
        $this->template = new Template(VIEW_TPL_PATH . "Main.tpl");
        $data = [
            "titleString" => __("appName")
        ];

        $accMod = AccountModel::getInstance();
        $transMod = TransactionModel::getInstance();
        $currMod = CurrencyModel::getInstance();
        $catModel = CategoryModel::getInstance();
        $iconModel = IconModel::getInstance();

        // Statistics widget
        $chartFilter = $transMod->getHistogramFilters([]);
        wlog("chartFilter: ", $chartFilter);

        $chartParams = (array)$chartFilter;
        $chartParams["limit"] = DEFAULT_CHART_LIMIT;

        if (isset($chartFilter->group)) {
            $groupType = TransactionModel::getHistogramGroupTypeByName($chartFilter->group);
            wlog("  groupType: ", $groupType);
            if ($groupType !== false) {
                $chartParams["group"] = $groupType;
            }
        }

        if ($chartFilter->report === "currency") {
            $accCurr = $chartFilter->curr_id;
        } else {
            $accounts = $chartFilter->accounts ?? null;
            $account = (is_array($accounts) && count($accounts) > 0)
                ? $accMod->getItem($accounts[0])
                : null;

            $accCurr = ($account) ? $account->curr_id : $currMod->getIdByPos(0);
            if (!$accCurr) {
                throw new \Error(__("currencies.errors.noCurrencies"));
            }
        }

        wlog("chartParams: ", $chartParams);

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $accMod->getData(["visibility" => "all", "owner" => "all"]),
            "persons" => $this->personMod->getData(["visibility" => "all"]),
            "categories" => $catModel->getData(),
            "currency" => $currMod->getData(),
            "icons" => $iconModel->getData(),
            "view" => [
                "transactions" => $transMod->getData(["desc" => true, "onPage" => 5]),
                "statistics" => [
                    "chartData" => $transMod->getHistogramSeries($chartParams),
                    "chartCurrency" => $accCurr,
                    "filter" => $chartFilter,
                ],
            ],
        ];

        $this->initResources("MainView");
        $this->render($data);
    }

    /**
     * /about/ route handler
     * Renders about view
     */
    public function about()
    {
        $this->template = new Template(VIEW_TPL_PATH . "About.tpl");
        $data = [
            "titleString" => __("appName")
        ];

        $app = Application::getInstance();

        $data["year"] = date("Y");
        $data["version"] = $app->getVersion();

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
        ];

        $this->initResources("AboutView");
        $this->render($data);
    }
}
