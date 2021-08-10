<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\Core\JSON;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\TransactionModel;

class Main extends TemplateController
{
    public function index()
    {
        $this->template = new Template(TPL_PATH . "main.tpl");
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
                "link" => BASEURL . "transactions/new/?acc_id=" . ($account->id),
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
        $trListData = [];
        foreach ($latestArr as $trans) {
            $itemData = $transMod->getListItem($trans);

            $trListData[] = $itemData;
        }

        $data["transactionsData"] = [
            "items" => $trListData,
            "showDetails" => false,
        ];

        $persArr = $this->personMod->getData();
        foreach ($persArr as $ind => $pData) {
            $noDebts = true;
            $pBalance = [];
            if (isset($pData->accounts) && is_array($pData->accounts)) {
                foreach ($pData->accounts as $pAcc) {
                    if ($pAcc->balance != 0.0) {
                        $noDebts = false;
                        $pBalance[] = $currMod->format($pAcc->balance, $pAcc->curr_id);
                    }
                }
            }

            $persArr[$ind]->nodebts = $noDebts;
            $persArr[$ind]->balfmt = $pBalance;
        }
        $data["persArr"] = $persArr;

        $byCurrency = true;
        $curr_acc_id = $currMod->getIdByPos(0);
        if (!$curr_acc_id) {
            throw new \Error("No currencies found");
        }

        $groupType_id = 2;        // group by week

        $data["statArr"] = $transMod->getHistogramSeries($byCurrency, $curr_acc_id, EXPENSE, $groupType_id, 5);

        $data["viewData"] = JSON::encode([
            "chartData" => $data["statArr"]
        ]);

        $this->cssArr[] = "MainView.css";
        $this->jsArr[] = "MainView.js";

        $this->render($data);
    }
}
