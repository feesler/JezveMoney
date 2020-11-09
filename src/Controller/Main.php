<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\TransactionModel;

class Main extends TemplateController
{
    public function index()
    {
        $accMod = AccountModel::getInstance();
        $transMod = TransactionModel::getInstance();
        $currMod = CurrencyModel::getInstance();

        $currArr = $currMod->getData();
        $accArr = $accMod->getData();

        $tilesArr = $accMod->getTilesArray();
        $totalsArr = $accMod->getTotalsArray();
        foreach ($totalsArr as $curr_id => $balance) {
            $currObj = $currMod->getItem($curr_id);
            if (!$currObj) {
                throw new \Error('Wrong currency id: ' . $curr_id);
            }

            $balfmt = $currMod->format($balance, $curr_id);

            $totalsArr[$curr_id] = ["bal" => $balance, "balfmt" => $balfmt, "name" => $currObj->name];
        }

        // Prepare data of transaction list items
        $latestArr = $transMod->getData(["desc" => true, "onPage" => 5]);
        $trListData = [];
        foreach ($latestArr as $trans) {
            $itemData = $transMod->getListItem($trans);

            $trListData[] = $itemData;
        }

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


        $byCurrency = true;
        $curr_acc_id = $currMod->getIdByPos(0);
        if (!$curr_acc_id) {
            throw new \Error("No currencies found");
        }

        $groupType_id = 2;        // group by week

        $statArr = $transMod->getHistogramSeries($byCurrency, $curr_acc_id, EXPENSE, $groupType_id, 5);

        $titleString = "Jezve Money";

        array_push($this->css->libs,
            "lib/iconlink.css",
            "tiles.css",
            "trlist.css",
            "lib/charts.css"
        );
        $this->buildCSS();

        array_push($this->jsArr,
            "lib/component.js",
            "lib/basechart.js",
            "lib/histogram.js",
            "component/header.js",
			"view.js",
			"mainview.js"
        );

        include(TPL_PATH . "main.tpl");
    }
}
