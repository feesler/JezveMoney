<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\JSON;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\TransactionModel;

class CheckBalance extends TemplateController
{
    protected $accName = null;


    public function fail()
    {
        echo "fail";
        exit;
    }


    public function getName($acc_id)
    {
        if (!isset($this->accName) || !is_array($this->accName)) {
            return null;
        }

        return isset($this->accName[$acc_id]) ? $this->accName[$acc_id] : null;
    }


    public function index()
    {
        $db = MySqlDB::getInstance();

        if (is_null($this->actionParam) || $this->actionParam == "all") {
            $checkAccount_id = 0;
        } else {
            $checkAccount_id = intval($this->actionParam);
            if (!$checkAccount_id) {
                $this->fail();
            }
        }

        $fixed = false;

        if (isset($_GET["act"]) && $_GET["act"] == "fix" && $checkAccount_id != 0) {
            if (isset($_POST["fixbal"])) {
                $fixbal = floatval($_POST["fixbal"]);

                if (!$db->updateQ("accounts", ["balance" => $fixbal], "id=" . $checkAccount_id)) {
                    $this->fail();
                }

                $fixed = true;
            }
        }


        if (isset($_GET["pos"])) {
            if ($_GET["pos"] == "ok") {
                $posUpd = true;
            } elseif ($_GET["pos"] == "fail") {
                $posUpd = false;
            }
        }


        $accMod = AccountModel::getInstance();
        $trMod = TransactionModel::getInstance();

        $initBalance = [];
        $curBalance = [];
        $realBalance = [];
        $this->accName = [];

        $accArr = $accMod->getData(["full" => true]);
        foreach ($accArr as $item) {
            $initBalance[$item->id] = $item->initbalance;
            $curBalance[$item->id] = $item->balance;
            $this->accName[$item->id] = $accMod->getNameOrPerson($item->id);

            $realBalance[$item->id] = $initBalance[$item->id];
        }

        $prev_date = 0;

        $params = [];
        if ($checkAccount_id != 0) {
            $params["accounts"] = $checkAccount_id;
        }
        $transArr = $trMod->getData($params);

        foreach ($transArr as $tr) {
            unset($tr->createdate);
            unset($tr->updatedate);

            if ($tr->type == EXPENSE) {
                if (!isset($realBalance[$tr->src_id])) {
                    $realBalance[$tr->src_id] = $tr->src_result;
                }

                $realBalance[$tr->src_id] = round($realBalance[$tr->src_id] - $tr->src_amount, 2);
                $tr->realbal = [$tr->src_id => $realBalance[$tr->src_id]];
            } elseif ($tr->type == INCOME) {
                if (!isset($realBalance[$tr->dest_id])) {
                    $realBalance[$tr->dest_id] = $tr->dest_result;
                }

                $realBalance[$tr->dest_id] = round($realBalance[$tr->dest_id] + $tr->dest_amount, 2);
                $tr->realbal = [$tr->dest_id => $realBalance[$tr->dest_id]];

                /* transfer to */
            } elseif ($checkAccount_id != 0 && $tr->type == TRANSFER && $tr->dest_id == $checkAccount_id) {
                $realBalance[$tr->src_id] = $tr->src_result;

                $realBalance[$checkAccount_id] = round($realBalance[$checkAccount_id] + $tr->dest_amount, 2);
                $tr->realbal = [
                    $checkAccount_id => $realBalance[$checkAccount_id],
                    $tr->src_id => $realBalance[$tr->src_id]
                ];

                /* transfer from */
            } elseif ($checkAccount_id != 0 && $tr->type == TRANSFER && $tr->src_id == $checkAccount_id) {
                $realBalance[$tr->dest_id] = $tr->dest_result;

                $realBalance[$checkAccount_id] = round($realBalance[$checkAccount_id] - $tr->src_amount, 2);
                $tr->realbal = [
                    $checkAccount_id => $realBalance[$checkAccount_id],
                    $tr->dest_id => $realBalance[$tr->dest_id]
                ];

                /* Transfer between two accounts */
            } elseif ($checkAccount_id == 0 && $tr->type == TRANSFER) {
                $realBalance[$tr->src_id] = round($realBalance[$tr->src_id] - $tr->src_amount, 2);
                $realBalance[$tr->dest_id] = round($realBalance[$tr->dest_id] + $tr->dest_amount, 2);
                $tr->realbal = [
                    $tr->src_id => $realBalance[$tr->src_id],
                    $tr->dest_id => $realBalance[$tr->dest_id]
                ];
            } elseif ($tr->type == DEBT) {
                $tr->realbal = [];

                if ($tr->src_id != 0) {
                    if ($tr->src_id == $checkAccount_id || $checkAccount_id == 0) {
                        $realBalance[$tr->src_id] = round($realBalance[$tr->src_id] - $tr->src_amount, 2);
                    } else {
                        $realBalance[$tr->src_id] = $tr->src_result;
                    }

                    $tr->realbal[$tr->src_id] = $realBalance[$tr->src_id];
                }
                if ($tr->dest_id != 0) {
                    if ($tr->dest_id == $checkAccount_id || $checkAccount_id == 0) {
                        $realBalance[$tr->dest_id] = round($realBalance[$tr->dest_id] + $tr->dest_amount, 2);
                    } else {
                        $realBalance[$tr->dest_id] = $tr->dest_result;
                    }

                    $tr->realbal[$tr->dest_id] = $realBalance[$tr->dest_id];
                }
            }

            $tr->correctdate = ($tr->date >= $prev_date);
            if ($tr->correctdate) {
                $prev_date = $tr->date;
            }
            $tr->datefmt = date("d.m.Y", $tr->date);
        }

        $balanceDiff = [];
        foreach ($realBalance as $acc_id => $rbrow) {
            if (!isset($curBalance[$acc_id])) {
                $curBalance[$acc_id] = 0;
            }

            $balanceDiff[$acc_id] = round($rbrow - $curBalance[$acc_id], 2);
        }

        $titleString = "Jezve Money | Check balance";

        array_push($this->css->libs, ...[
            "charts.css"
        ]);
        $this->buildCSS();
        array_push($this->jsArr, ...[
            "lib/raphael.min.js",
            "charts.js",
            "checkbalance.js"
        ]);

        if (isset($_GET["tr"])) {
            echo ("var transactions = " . JSON::encode($transArr) . ";");
            exit;
        } else {
            include(TPL_PATH . "checkbalance.tpl");
        }
    }
}
