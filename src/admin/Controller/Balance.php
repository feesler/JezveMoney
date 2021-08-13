<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\TransactionModel;

class Balance extends AdminController
{
    public function index()
    {
        $this->template = new Template(ADMIN_TPL_PATH . "balance.tpl");
        $data = [
            "titleString" => "Admin panel | Balance",
        ];

        $srcAvailTypes = [EXPENSE, TRANSFER, DEBT];
        $destAvailTypes = [INCOME, TRANSFER, DEBT];

        $accModel = AccountModel::getInstance();
        $accounts = $accModel->getData(["full" => true]);

        $trModel = TransactionModel::getInstance();
        $resArr = $trModel->getData();
        $transactions = [];
        $results = [];
        foreach ($resArr as $tr) {
            $tr->typeStr = TransactionModel::typeToString($tr->type);
            $tr->dateStr = date("d.m.Y", $tr->date);

            if ($tr->src_id && in_array($tr->type, $srcAvailTypes)) {
                if (!isset($results[$tr->src_id])) {
                    $accObj = $accModel->getItem($tr->src_id);
                    if (!$accObj) {
                        throw new \Error("Account {$tr->src_id} not found");
                    }
                    $results[$tr->src_id] = $accObj->initbalance;
                }

                $results[$tr->src_id] = round($results[$tr->src_id] - $tr->src_amount, 2);
                $tr->exp_src_result = $results[$tr->src_id];
            } else {
                $tr->exp_src_result = 0;
            }


            if ($tr->dest_id && in_array($tr->type, $destAvailTypes)) {
                if (!isset($results[$tr->dest_id])) {
                    $accObj = $accModel->getItem($tr->dest_id);
                    if (!$accObj) {
                        throw new \Error("Account {$tr->dest_id} not found");
                    }
                    $results[$tr->dest_id] = $accObj->initbalance;
                }

                $results[$tr->dest_id] = round($results[$tr->dest_id] + $tr->dest_amount, 2);
                $tr->exp_dest_result = $results[$tr->dest_id];
            } else {
                $tr->exp_dest_result = 0;
            }

            $transactions[] = $tr;
        }
        $data["transactions"] = $transactions;

        $this->menuItems["balance"]["active"] = true;
        $this->cssAdmin[] = "BalanceView.css";

        $this->render($data);
    }
}
