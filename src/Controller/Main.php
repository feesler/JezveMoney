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

        // Prepare data of transaction list items
        $transactions = $transMod->getData(["desc" => true, "onPage" => 5]);
        $data["transactionsCount"] = count($transactions);

        // Find most frequent currency of latest transactions
        $currencies = [];
        foreach ($transactions as $item) {
            if (!isset($currencies[$item->src_curr])) {
                $currencies[$item->src_curr] = 0;
            }
            $currencies[$item->src_curr]++;

            if (!isset($currencies[$item->dest_curr])) {
                $currencies[$item->dest_curr] = 0;
            }
            $currencies[$item->dest_curr]++;
        }
        $currencyId = 0;
        foreach ($currencies as $curr_id => $value) {
            if (!$currencyId || $value > $currencies[$currencyId]) {
                $currencyId = $curr_id;
            }
        }

        if (!$currencyId) {
            $currencyId = $currMod->getIdByPos(0);
        }
        if (!$currencyId) {
            throw new \Error("No currencies found");
        }

        $chartRequest = [
            "report" => "currency",
            "curr_id" => $currencyId,
            "type" => EXPENSE,
            "group" => GROUP_BY_WEEK,
            "limit" => 5,
        ];
        $chartFilter = (object)$chartRequest;
        $chartFilter->group = TransactionModel::getHistogramGroupName($chartFilter->group);

        $iconModel = IconModel::getInstance();

        $accounts = $accMod->getData(["visibility" => "all", "owner" => "all"]);
        $persons = $this->personMod->getData(["visibility" => "all"]);
        $data["accountsCount"] = count($accounts);
        $data["personsCount"] = count($persons);

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $accounts,
            "persons" => $persons,
            "categories" => $catModel->getData(),
            "currency" => $currMod->getData(),
            "icons" => $iconModel->getData(),
            "view" => [
                "transactions" => $transactions,
                "chartData" => $transMod->getHistogramSeries($chartRequest),
                "chartCurrency" => $currencyId,
                "chartRequest" => $chartFilter,
            ]
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
