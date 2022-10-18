<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\TransactionModel;
use JezveMoney\App\Item\TransactionItem;

class Main extends TemplateController
{
    public function index()
    {
        $this->template = new Template(VIEW_TPL_PATH . "Main.tpl");
        $data = [
            "titleString" => "Jezve Money"
        ];

        $accMod = AccountModel::getInstance();
        $transMod = TransactionModel::getInstance();
        $currMod = CurrencyModel::getInstance();

        $accounts = $accMod->getData();
        $data["tilesArr"] = [];
        foreach ($accounts as $account) {
            $data["tilesArr"][] = [
                "type" => "link",
                "link" => BASEURL . "transactions/create/?acc_id=" . ($account->id),
                "title" => $account->name,
                "subtitle" => $currMod->format($account->balance, $account->curr_id),
                "icon" => $accMod->getIconFile($account->id)
            ];
        }

        $totalsArr = $accMod->getTotalsArray();
        foreach ($totalsArr as $curr_id => $balance) {
            $currObj = $currMod->getItem($curr_id);
            if (!$currObj) {
                throw new \Error('Wrong currency id: ' . $curr_id);
            }

            $balfmt = $currMod->format($balance, $curr_id);

            $totalsArr[$curr_id] = ["bal" => $balance, "balfmt" => $balfmt, "name" => $currObj->name];
        }
        $data["totalsArr"] = $totalsArr;

        // Prepare data of transaction list items
        $latestArr = $transMod->getData(["desc" => true, "onPage" => 5]);
        $transactions = [];
        foreach ($latestArr as $trans) {
            $transactions[] = new TransactionItem($trans);
        }

        $persArr = $this->personMod->getData();
        $data["persons"] = [];
        foreach ($persArr as $person) {
            $pBalance = [];
            if (isset($person->accounts) && is_array($person->accounts)) {
                foreach ($person->accounts as $pAcc) {
                    if ($pAcc->balance != 0.0) {
                        $pBalance[] = $currMod->format($pAcc->balance, $pAcc->curr_id);
                    }
                }
            }

            $subtitle = (count($pBalance) > 0) ? $pBalance : "No debts";

            $data["persons"][] = [
                "type" => "link",
                "link" => BASEURL . "transactions/create/?type=debt&person_id=" . ($person->id),
                "title" => $person->name,
                "subtitle" => $subtitle,
            ];
        }

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

        $data["statArr"] = $transMod->getHistogramSeries([
            "filter" => "currency",
            "curr_id" => $currencyId,
            "type" => EXPENSE,
            "group" => GROUP_BY_WEEK,
            "limit" => 5
        ]);

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $accMod->getData(["full" => true, "type" => "all"]),
            "persons" => $this->personMod->getData(["type" => "all"]),
            "currency" => $currMod->getData(),
            "view" => [
                "transactions" => $transactions,
                "chartData" => $data["statArr"]
            ]
        ];

        $this->cssArr[] = "MainView.css";
        $this->jsArr[] = "MainView.js";

        $this->render($data);
    }

    public function about()
    {
        $this->template = new Template(VIEW_TPL_PATH . "About.tpl");
        $data = [
            "titleString" => "Jezve Money"
        ];

        $data["year"] = date("Y");
        $data["version"] = APP_VERSION;

        $this->cssArr[] = "AboutView.css";
        $this->jsArr[] = "AboutView.js";

        $this->render($data);
    }
}
