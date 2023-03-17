<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\TransactionModel;

/**
 * Balance admin controller
 */
class Balance extends AdminController
{
    /**
     * /admin/balance/ route handler
     * Renders balance admin view
     */
    public function index()
    {
        $this->template = new Template(ADMIN_VIEW_TPL_PATH . "Balance.tpl");
        $data = [
            "titleString" => "Admin panel | Balance",
        ];

        $trModel = TransactionModel::getInstance();

        $srcAvailTypes = [EXPENSE, TRANSFER, DEBT];
        $destAvailTypes = [INCOME, TRANSFER, DEBT];

        $accModel = AccountModel::getInstance();
        $accounts = $accModel->getData(["visibility" => "all", "sort" => "visibility"]);
        $data["accounts"] = $accounts;

        $filter = new \stdClass();
        $trParams = [
            "onPage" => 0,
            "desc" => false
        ];
        // Prepare array of requested accounts filter
        $accFilter = [];
        if (isset($_GET["accounts"])) {
            $accountsReq = $_GET["accounts"];
            if (!is_array($accountsReq)) {
                $accountsReq = [$accountsReq];
            }
            foreach ($accountsReq as $acc_id) {
                if ($accModel->isExist($acc_id)) {
                    $accFilter[] = intval($acc_id);
                }
            }
        }
        $trParams["accounts"] = $filter->accounts = $accFilter;
        $data["accFilter"] = $accFilter;

        if (count($accFilter)) {
            $resArr = $trModel->getData($trParams);
        } else {
            $resArr = [];
        }
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

                $results[$tr->src_id] = normalize($results[$tr->src_id] - $tr->src_amount);
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

                $results[$tr->dest_id] = normalize($results[$tr->dest_id] + $tr->dest_amount);
                $tr->exp_dest_result = $results[$tr->dest_id];
            } else {
                $tr->exp_dest_result = 0;
            }

            $transactions[] = $tr;
        }
        $data["transactions"] = $transactions;

        $data["appProps"] = [
            "view" => [
                "accounts" => $accounts,
                "filter" => $filter,
            ],
        ];

        $this->initResources("BalanceView");
        $this->render($data);
    }
}
