<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;
use JezveMoney\Core\JSON;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\IconModel;
use JezveMoney\App\Model\TransactionModel;
use JezveMoney\App\Model\DebtModel;

class Transactions extends TemplateController
{
    protected $requiredFields = [
        "type",
        "src_id",
        "dest_id",
        "src_amount",
        "dest_amount",
        "src_curr",
        "dest_curr",
        "date",
        "comment"
    ];
    protected $debtRequiredFields = [
        "type",
        "person_id",
        "acc_id",
        "op",
        "src_amount",
        "dest_amount",
        "src_curr",
        "dest_curr",
        "date",
        "comment"
    ];
    protected $model = null;
    protected $accModel = null;
    protected $currModel = null;


    protected function onStart()
    {
        $this->model = TransactionModel::getInstance();
        $this->accModel = AccountModel::getInstance();
        $this->currModel = CurrencyModel::getInstance();
    }


    public function index()
    {
        $this->template = new Template(TPL_PATH . "transactions.tpl");
        $data = [
            "titleString" => "Jezve Money | Transactions"
        ];
        $listData = [
            "showPaginator" => true,
        ];

        $filterObj = new \stdClass();
        $trParams = [
            "onPage" => 10,
            "desc" => true
        ];

        // Obtain requested transaction type filter
        $typeFilter = [];
        if (isset($_GET["type"])) {
            $typeReq = $_GET["type"];
            if (!is_array($typeReq)) {
                $typeReq = [$typeReq];
            }

            foreach ($typeReq as $type_str) {
                $type_id = intval($type_str);
                if (!$type_id) {
                    $type_id = TransactionModel::stringToType($type_str);
                }
                if ($type_id) {
                    $typeFilter[] = $type_id;
                }
            }
            if (count($typeFilter) > 0) {
                $trParams["type"] = $filterObj->type = $typeFilter;
            }
        }

        // Obtain requested page number
        if (isset($_GET["page"])) {
            $filterObj->page = intval($_GET["page"]);
            if ($filterObj->page > 1) {
                $trParams["page"] = $filterObj->page - 1;
            }
        }

        // Prepare array of requested accounts filter
        $accFilter = [];
        if (isset($_GET["acc_id"])) {
            $accountsReq = $_GET["acc_id"];
            if (!is_array($accountsReq)) {
                $accountsReq = [$accountsReq];
            }
            foreach ($accountsReq as $acc_id) {
                if ($this->accModel->isExist($acc_id)) {
                    $accFilter[] = intval($acc_id);
                }
            }
            if (count($accFilter) > 0) {
                $trParams["accounts"] = $filterObj->acc_id = $accFilter;
            }
        }
        $data["accFilter"] = $accFilter;

        // Obtain requested search query
        $searchReq = (isset($_GET["search"]) ? $_GET["search"] : null);
        if (!is_null($searchReq)) {
            $trParams["search"] = $filterObj->search = $searchReq;
        }
        $data["searchReq"] = $searchReq;

        // Obtain requested date range
        $stDate = (isset($_GET["stdate"]) ? $_GET["stdate"] : null);
        $endDate = (isset($_GET["enddate"]) ? $_GET["enddate"] : null);

        $dateFmt = "";
        if (!is_null($stDate) && !is_null($endDate)) {
            $sdate = strtotime($stDate);
            $edate = strtotime($endDate);
            if ($sdate != -1 && $edate != -1) {
                $dateFmt = date("d.m.Y", $sdate) . " - " . date("d.m.Y", $edate);
            }

            $trParams["startDate"] = $filterObj->stdate = $stDate;
            $trParams["endDate"] = $filterObj->enddate = $endDate;
        }
        $data["dateFmt"] = $dateFmt;

        // Obtain requested view mode
        $showDetails = false;
        if (isset($_GET["mode"]) && $_GET["mode"] == "details") {
            $showDetails = true;
            $filterObj->mode = "details";
        }
        $listData["showDetails"] = $showDetails;

        $data["accArr"] = $this->accModel->getData();
        $data["hiddenAccArr"] = $this->accModel->getData(["type" => "hidden"]);
        $data["accounts"] = $this->accModel->getCount(["type" => "all"]);

        $transArr = $this->model->getData($trParams);

        $transCount = $this->model->getTransCount($trParams);
        $data["transCount"] = $transCount;

        $currArr = $this->currModel->getData();

        // Prepare transaction types menu
        $trTypes = [0 => "Show all"];
        $availTypes = TransactionModel::getTypeNames();
        array_push($trTypes, ...$availTypes);

        $transMenu = [];
        $baseUrl = BASEURL . "transactions/";
        foreach ($trTypes as $type_id => $trTypeName) {
            $urlParams = (array)$filterObj;

            if ($type_id != 0) {
                $urlParams["type"] = strtolower($trTypeName);
            } else {
                unset($urlParams["type"]);
            }

            // Clear page number because list of transactions guaranteed to change on change type filter
            unset($urlParams["page"]);

            $menuItem = new \stdClass();
            $menuItem->type = $type_id;
            $menuItem->title = $trTypeName;

            if ($type_id == 0) {
                $menuItem->selected = !isset($filterObj->type) || !count($filterObj->type);
            } else {
                $menuItem->selected = isset($filterObj->type) && in_array($type_id, $filterObj->type);
            }
            $menuItem->url = urlJoin($baseUrl, $urlParams);

            $transMenu[] = $menuItem;
        }
        $data["transMenu"] = $transMenu;

        // Prepare mode selector and paginator
        if ($listData["showPaginator"] == true) {
            // Prepare classic/details mode link
            $urlParams = (array)$filterObj;
            $urlParams["mode"] = ($showDetails) ? "classic" : "details";

            $listData["modeLink"] = urlJoin(BASEURL . "transactions/", $urlParams);

            // Build data for paginator
            if ($trParams["onPage"] > 0) {
                $urlParams = (array)$filterObj;

                $pageCount = ceil($transCount / $trParams["onPage"]);
                $page_num = isset($trParams["page"]) ? intval($trParams["page"]) : 0;
                $pagesArr = [];
                if ($transCount > $trParams["onPage"]) {
                    $pagesArr = $this->model->getPaginatorArray($page_num, $pageCount);
                }

                foreach ($pagesArr as $ind => $pageItem) {
                    if (is_numeric($pageItem["text"]) && !$pageItem["active"]) {
                        $urlParams["page"] = intval($pageItem["text"]);

                        $pagesArr[$ind]["link"] = urlJoin(BASEURL . "transactions/", $urlParams);
                    }
                }
            }
            $listData["paginator"] = ["pagesArr" => $pagesArr];
        }

        // Prepare data of transaction list items
        $trListData = [];
        foreach ($transArr as $trans) {
            $itemData = $this->model->getListItem($trans, $showDetails);

            $trListData[] = $itemData;
        }
        $listData["items"] = $trListData;

        $data["listData"] = $listData;

        $data["viewData"] = JSON::encode([
            "accounts" => $data["accArr"],
            "currency" => $currArr,
            "transArr" => $transArr,
            "filterObj" => $filterObj
        ]);

        $this->cssArr[] = "TransactionListView.css";
        $this->jsArr[] = "TransactionListView.js";

        $this->render($data);
    }


    private function fail($msg = null)
    {
        if (!is_null($msg)) {
            Message::set($msg);
        }

        setLocation(BASEURL);
    }


    protected function getAccountTileData($account, $tileId, $balanceDiff = 0)
    {
        return [
            "attributes" => ["id" => $tileId],
            "title" => $account->name,
            "subtitle" => $this->currModel->format($account->balance + $balanceDiff, $account->curr_id),
            "icon" => $this->accModel->getIconFile($account->id)
        ];
    }


    public function create()
    {
        if ($this->isPOST()) {
            $this->createTransaction();
        }

        $this->template = new Template(TPL_PATH . "transaction.tpl");
        $data = [];

        $action = "new";
        $data["action"] = $action;

        $iconModel = IconModel::getInstance();
        $defMsg = ERR_TRANS_CREATE;

        $tr = [
            "type" => EXPENSE,
            "src_amount" => 0,
            "dest_amount" => 0,
            "comment" => ""
        ];

        // check predefined type of transaction
        if (isset($_GET["type"])) {
            $tr["type"] = TransactionModel::stringToType($_GET["type"]);
            if (!$tr["type"]) {
                $this->fail("Invalid transaction type");
            }
        }

        // Check specified account
        $acc_id = 0;
        if (isset($_GET["acc_id"])) {
            $acc_id = intval($_GET["acc_id"]);
        }
        // Redirect if invalid account is specified
        if ($acc_id && !$this->accModel->isExist($acc_id)) {
            $this->fail($defMsg);
        }
        // Use first account if nothing is specified
        if (!$acc_id) {
            $acc_id = $this->accModel->getIdByPos(0);
        }
        if (!$acc_id) {
            $this->fail($defMsg);
        }
        $data["acc_id"] = $acc_id;

        $give = true;
        $person_id = 0;
        $person_acc_id = 0;
        $debtAcc = null;
        $noAccount = false;
        $srcAmountCurr = 0;
        $destAmountCurr = 0;

        if ($tr["type"] == DEBT) {
            $debtAcc = $this->accModel->getItem($acc_id);

            // Prepare person account
            $visiblePersons = $this->personMod->getData();
            if (is_array($visiblePersons) && count($visiblePersons) > 0) {
                $person_id = $visiblePersons[0]->id;
            }
            $pObj = $this->personMod->getItem($person_id);
            $person_acc = $this->accModel->getPersonAccount($person_id, $debtAcc->curr_id);
            $person_acc_id = ($person_acc) ? $person_acc->id : 0;
            $person_res_balance = ($person_acc) ? $person_acc->balance : 0.0;
            $person_balance = $person_res_balance;

            $data["acc_id"] = ($debtAcc) ? $debtAcc->id : 0;

            $data["personTile"] = [
                "attributes" => ["id" => "person_tile"],
                "title" => ($pObj) ? $pObj->name : null,
                "subtitle" => $this->currModel->format($person_balance, $debtAcc->curr_id)
            ];
            $data["debtAccountTile"] = $this->getAccountTileData($debtAcc, "acc_tile");

            $tr["src_id"] = $person_acc_id;
            $tr["dest_id"] = $acc_id;
            $tr["src_curr"] = $debtAcc->curr_id;
            $tr["dest_curr"] = $debtAcc->curr_id;
            $tr["person_id"] = $person_id;
            $tr["debtType"] = $give;
            $tr["lastAcc_id"] = $acc_id;
            $tr["noAccount"] = $noAccount;
        } else {
            // set source and destination accounts
            $src_id = 0;
            $dest_id = 0;
            if ($tr["type"] == EXPENSE || $tr["type"] == TRANSFER) {
                $src_id = ($acc_id ? $acc_id : $this->accModel->getIdByPos(0));
            } elseif ($tr["type"] == INCOME) {       // income
                $dest_id = ($acc_id ? $acc_id : $this->accModel->getIdByPos(0));
            }

            if ($tr["type"] == TRANSFER) {
                $dest_id = $this->accModel->getAnother($src_id);
            }

            $tr["src_id"] = $src_id;
            $tr["dest_id"] = $dest_id;
            $tr["src_curr"] = 0;
            $tr["dest_curr"] = 0;

            if ($src_id != 0) {
                $accObj = $this->accModel->getItem($src_id);
                if ($accObj) {
                    $tr["src_curr"] = $accObj->curr_id;
                }
            }

            if ($dest_id != 0) {
                $accObj = $this->accModel->getItem($dest_id);
                if ($accObj) {
                    $tr["dest_curr"] = $accObj->curr_id;
                }
            }

            if ($tr["type"] == EXPENSE) {
                $tr["dest_curr"] = $tr["src_curr"];
            } elseif ($tr["type"] == INCOME) {
                $tr["src_curr"] = $tr["dest_curr"];
            }
        }
        $data["tr"] = $tr;
        $data["acc_count"] = $this->accModel->getCount();

        $src = null;
        $dest = null;
        if ($tr["type"] != DEBT) {
            // get information about source and destination accounts
            $src = $this->accModel->getItem($tr["src_id"]);
            if ($src) {
                $data["srcAccountTile"] = $this->getAccountTileData($src, "source_tile");
            }

            $dest = $this->accModel->getItem($tr["dest_id"]);
            if ($dest) {
                $data["destAccountTile"] = $this->getAccountTileData($dest, "dest_tile");
            }
        }
        $data["src"] = $src;
        $data["dest"] = $dest;

        // Prepare transaction types menu
        $trTypes = TransactionModel::getTypeNames();
        $transMenu = [];
        $baseUrl = BASEURL . "transactions/new/";
        foreach ($trTypes as $type_id => $trTypeName) {
            $params = ["type" => strtolower($trTypeName)];
            if ($acc_id != 0) {
                $params["acc_id"] = $acc_id;
            }

            $menuItem = new \stdClass();
            $menuItem->type = $type_id;
            $menuItem->title = $trTypeName;
            $menuItem->selected = ($menuItem->type == $tr["type"]);
            $menuItem->url = urlJoin($baseUrl, $params);

            $transMenu[] = $menuItem;
        }
        $data["transMenu"] = $transMenu;

        $data["formAction"] = BASEURL . "transactions/" . $action . "/";

        if ($tr["type"] == EXPENSE || $tr["type"] == TRANSFER || $tr["type"] == DEBT) {
            $srcBalTitle = "Result balance";
            if ($tr["type"] == TRANSFER) {
                $srcBalTitle .= " (Source)";
            } elseif ($tr["type"] == DEBT) {
                $srcBalTitle .= ($give) ? " (Person)" : " (Account)";
            }
            $data["srcBalTitle"] = $srcBalTitle;

            $balDiff = $tr["src_amount"];
            if ($tr["type"] != DEBT && !is_null($src)) {
                $src->balfmt = $this->currModel->format($src->balance + $balDiff, $src->curr_id);
                $src->icon = $this->accModel->getIconFile($src->id);
            }
        }

        if ($tr["type"] == INCOME || $tr["type"] == TRANSFER || $tr["type"] == DEBT) {
            $destBalTitle = "Result balance";
            if ($tr["type"] == TRANSFER) {
                $destBalTitle .= " (Destination)";
            } elseif ($tr["type"] == DEBT) {
                $destBalTitle .= ($give) ? " (Account)" : " (Person)";
            }
            $data["destBalTitle"] = $destBalTitle;

            $balDiff = $tr["dest_amount"];
            if ($tr["type"] != DEBT && !is_null($dest)) {
                $dest->balfmt = $this->currModel->format($dest->balance - $balDiff, $dest->curr_id);
                $dest->icon = $this->accModel->getIconFile($dest->id);
            }
        }

        if ($tr["type"] != DEBT) {
            if (!is_null($src)) {
                $srcAmountCurr = $src->curr_id;
            } elseif (!is_null($dest)) {
                $srcAmountCurr = $dest->curr_id;
            } else {
                $srcAmountCurr = 0;
            }

            if (!is_null($dest)) {
                $destAmountCurr = $dest->curr_id;
            } elseif (!is_null($src)) {
                $destAmountCurr = $src->curr_id;
            } else {
                $destAmountCurr = 0;
            }

            /**
             * Show destination amount input for expense and source amount input for income by default,
             * because it's amount with changing currency.
             * Meanwhile source amount for expense and destination amount for income are
             * always have the same currency as account.
             */
            $showSrcAmount = ($tr["type"] != EXPENSE);
            if ($tr["type"] == TRANSFER) {
                $showDestAmount = ($srcAmountCurr != $destAmountCurr);
            } else {
                $showDestAmount = ($tr["type"] != INCOME);
            }
        } else {
            $tr["src_id"] = $person_acc_id;

            $srcAmountCurr = $debtAcc ? $debtAcc->curr_id : 0;
            $destAmountCurr = $debtAcc ? $debtAcc->curr_id : 0;

            $showSrcAmount = true;
            $showDestAmount = false;
        }
        $data["srcAmountCurr"] = $srcAmountCurr;
        $data["showSrcAmount"] = $showSrcAmount;
        $data["destAmountCurr"] = $destAmountCurr;
        $data["showDestAmount"] = $showDestAmount;

        // Common arrays
        $profileData = [
            "user_id" => $this->user_id,
            "owner_id" => $this->owner_id,
            "name" => $this->user_name,
        ];

        $showBothAmounts = $showSrcAmount && $showDestAmount;
        $data["srcAmountLbl"] = ($showBothAmounts) ? "Source amount" : "Amount";
        $data["destAmountLbl"] = ($showBothAmounts) ? "Destination amount" : "Amount";

        if ($tr["type"] == DEBT) {
            if ($noAccount) {
                $data["accLbl"] = "No account";
            } else {
                $data["accLbl"] = ($give)
                    ? "Destination account"
                    : "Source account";
            }
        }

        $currObj = $this->currModel->getItem($srcAmountCurr);
        $srcAmountSign = $currObj ? $currObj->sign : null;
        $data["srcAmountSign"] = $srcAmountSign;

        $currObj = $this->currModel->getItem($destAmountCurr);
        $destAmountSign = $currObj ? $currObj->sign : null;
        $data["destAmountSign"] = $destAmountSign;

        $data["exchSign"] = $destAmountSign . "/" . $srcAmountSign;
        $data["exchValue"] = 1;

        if ($tr["type"] != DEBT) {
            $srcResBalance = ($src) ? $src->balance : null;
            $destResBalance = ($dest) ? $dest->balance : null;

            $rtSrcResBal = $src ? $this->currModel->format($src->balance, $src->curr_id) : null;
            $rtDestResBal = $dest ? $this->currModel->format($dest->balance, $dest->curr_id) : null;
        } else {
            $acc_res_balance = ($debtAcc && !$noAccount) ? $debtAcc->balance : null;

            $srcResBalance = ($give) ? $person_res_balance : $acc_res_balance;
            $destResBalance = ($give) ? $acc_res_balance : $person_res_balance;

            $rtSrcResBal = $this->currModel->format($srcResBalance, $srcAmountCurr);
            $rtDestResBal = $this->currModel->format($destResBalance, $destAmountCurr);
        }
        $data["srcResBalance"] = $srcResBalance;
        $data["destResBalance"] = $destResBalance;

        $data["srcAmountInfo"] = [
            "id" => "src_amount_left",
            "title" => $data["srcAmountLbl"],
            "value" => $this->currModel->format($tr["src_amount"], $srcAmountCurr),
            "hidden" => true
        ];
        $data["destAmountInfo"] = [
            "id" => "dest_amount_left",
            "title" => $data["destAmountLbl"],
            "value" => $this->currModel->format($tr["dest_amount"], $destAmountCurr),
            "hidden" => true
        ];
        $data["srcResultInfo"] = [
            "id" => "src_res_balance_left",
            "title" => "Result balance",
            "value" => $rtSrcResBal,
            "hidden" => false
        ];
        $data["destResultInfo"] = [
            "id" => "dest_res_balance_left",
            "title" => "Result balance",
            "value" => $rtDestResBal,
            "hidden" => false
        ];
        $data["exchangeInfo"] = [
            "id" => "exch_left",
            "title" => "Exchange rate",
            "value" => $data["exchValue"] . " " . $data["exchSign"],
            "hidden" => ($tr["src_curr"] == $tr["dest_curr"])
        ];

        $data["dateFmt"] = date("d.m.Y");

        $data["headString"] = ($tr["type"] == DEBT)
            ? "New debt"
            : "New transaction";

        $data["titleString"] = "Jezve Money | " . $data["headString"];

        $viewData = [
            "mode" => $this->action,
            "profile" => $profileData,
            "transaction" => $tr,
            "accounts" => $this->accModel->getData(["type" => "all", "full" => true]),
            "currency" => $this->currModel->getData(),
            "icons" => $iconModel->getData()
        ];
        if ($tr["type"] == DEBT) {
            $viewData["persons"] = $this->personMod->getData(["type" => "all"]);
        }
        $data["viewData"] = JSON::encode($viewData);

        $this->cssArr[] = "TransactionView.css";
        $this->jsArr[] = "TransactionView.js";

        $this->render($data);
    }


    public function update()
    {
        if ($this->isPOST()) {
            $this->updateTransaction();
        }

        $this->template = new Template(TPL_PATH . "transaction.tpl");
        $data = [];

        $action = "edit";
        $data["action"] = $action;

        $iconModel = IconModel::getInstance();
        $defMsg = ERR_TRANS_UPDATE;

        $trans_id = intval($this->actionParam);
        if (!$trans_id) {
            $this->fail($defMsg);
        }
        if (!$this->model->isExist($trans_id)) {
            $this->fail($defMsg);
        }

        $item = $this->model->getItem($trans_id);
        if (is_null($item)) {
            $this->fail($defMsg);
        }
        $tr = (array)$item;

        $data["acc_count"] = $this->accModel->getCount(["full" => ($tr["type"] == DEBT)]);

        $src = null;
        $dest = null;
        // get information about source and destination accounts
        if ($tr["type"] != DEBT) {
            $src = $this->accModel->getItem($tr["src_id"]);
            if ($src) {
                $data["srcAccountTile"] = $this->getAccountTileData($src, "source_tile", $tr["src_amount"]);
            }

            $dest = $this->accModel->getItem($tr["dest_id"]);
            if ($dest) {
                $data["destAccountTile"] = $this->getAccountTileData($dest, "dest_tile", -$tr["dest_amount"]);
            }
        }
        $data["src"] = $src;
        $data["dest"] = $dest;

        // Prepare transaction types menu
        $trTypes = TransactionModel::getTypeNames();
        $transMenu = [];
        $baseUrl = BASEURL . "transactions/new/";
        foreach ($trTypes as $type_id => $trTypeName) {
            $params = ["type" => strtolower($trTypeName)];

            $menuItem = new \stdClass();
            $menuItem->type = $type_id;
            $menuItem->title = $trTypeName;
            $menuItem->selected = ($menuItem->type == $tr["type"]);
            $menuItem->url = urlJoin($baseUrl, $params);

            $transMenu[] = $menuItem;
        }
        $data["transMenu"] = $transMenu;

        $data["formAction"] = BASEURL . "transactions/" . $action . "/";

        $srcBalTitle = "Result balance";
        if ($tr["type"] == TRANSFER) {
            $srcBalTitle .= " (Source)";
        }

        $destBalTitle = "Result balance";
        if ($tr["type"] == TRANSFER) {
            $destBalTitle .= " (Destination)";
        }

        $person_id = 0;
        $person_acc_id = 0;
        $acc_id = 0;
        $give = true;
        $debtAcc = null;
        $noAccount = false;
        $showSrcAmount = true;
        $showDestAmount = false;

        if ($tr["type"] != DEBT) {
            $srcAmountCurr = $tr["src_curr"];
            $destAmountCurr = $tr["dest_curr"];

            if ($srcAmountCurr == $destAmountCurr) {
                if ($tr["type"] == EXPENSE) {
                    $showSrcAmount = false;
                    $showDestAmount = true;
                } elseif ($tr["type"] == INCOME || $tr["type"] == TRANSFER) {
                    $showSrcAmount = true;
                    $showDestAmount = false;
                }
            } else {
                $showSrcAmount = true;
                $showDestAmount = true;
            }
        } else {
            // get information about source and destination accounts
            $src = $this->accModel->getItem($tr["src_id"]);
            $dest = $this->accModel->getItem($tr["dest_id"]);

            $uObj = $this->uMod->getItem($this->user_id);
            if (!$uObj) {
                throw new \Error("User not found");
            }

            $give = (!is_null($src) && $src->owner_id != $uObj->owner_id);

            $srcBalTitle .= ($give) ? " (Person)" : " (Account)";
            $destBalTitle .= ($give) ? " (Account)" : " (Person)";

            $person_id = ($give) ? $src->owner_id : $dest->owner_id;
            $pObj = $this->personMod->getItem($person_id);
            if (!$pObj) {
                throw new \Error("Person not found");
            }

            $data["person_name"] = $pObj->name;

            $person_acc_id = ($give) ? $tr["src_id"] : $tr["dest_id"];
            $person_acc = $this->accModel->getItem($person_acc_id);
            $person_res_balance = $person_acc->balance;
            $person_balance = $person_res_balance + (($give) ? $tr["src_amount"] : -$tr["dest_amount"]);

            $debtAcc = $give ? $dest : $src;
            $noAccount = is_null($debtAcc);

            $data["personTile"] = [
                "attributes" => ["id" => "person_tile"],
                "title" => $pObj->name,
                "subtitle" => $this->currModel->format($person_balance, $person_acc->curr_id)
            ];

            $srcAmountCurr = $tr["src_curr"];
            $destAmountCurr = $tr["dest_curr"];
            if ($noAccount) {
                $destAmountCurr = $person_acc->curr_id;

                $acc_id = $this->accModel->getIdByPos(0);
                $debtAcc = $this->accModel->getItem($acc_id);
                if (!$debtAcc) {
                    throw new \Error("Account " . $acc_id . " not found");
                }
            }

            $showSrcAmount = true;
            $showDestAmount = false;
        }

        $data["srcAmountCurr"] = $srcAmountCurr;
        $data["showSrcAmount"] = $showSrcAmount;
        $data["destAmountCurr"] = $destAmountCurr;
        $data["showDestAmount"] = $showDestAmount;
        $data["srcBalTitle"] = $srcBalTitle;
        $data["destBalTitle"] = $destBalTitle;

        $tr["person_id"] = $person_id;
        $tr["debtType"] = $give;
        $tr["lastAcc_id"] = $acc_id;
        $tr["noAccount"] = $noAccount;

        $data["tr"] = $tr;

        // Common arrays
        $profileData = [
            "user_id" => $this->user_id,
            "owner_id" => $this->owner_id,
            "name" => $this->user_name,
        ];

        $showBothAmounts = $showSrcAmount && $showDestAmount;
        $data["srcAmountLbl"] = ($showBothAmounts) ? "Source amount" : "Amount";
        $data["destAmountLbl"] = ($showBothAmounts) ? "Destination amount" : "Amount";

        $accLbl = null;
        if ($tr["type"] == DEBT) {
            if ($noAccount) {
                $accLbl = "No account";
            } else {
                $accLbl = ($give)
                    ? "Destination account"
                    : "Source account";
            }

            if ($debtAcc) {
                $balanceDiff = 0;
                if (!$noAccount) {
                    $balanceDiff = ($give) ? -$tr["dest_amount"] : $tr["src_amount"];
                }

                $data["debtAccountTile"] = $this->getAccountTileData($debtAcc, "acc_tile", $balanceDiff);
            }
            $data["acc_id"] = ($debtAcc) ? $debtAcc->id : 0;
        }
        $data["accLbl"] = $accLbl;

        $currObj = $this->currModel->getItem($srcAmountCurr);
        $data["srcAmountSign"] = $currObj ? $currObj->sign : null;

        $currObj = $this->currModel->getItem($destAmountCurr);
        $data["destAmountSign"] = $currObj ? $currObj->sign : null;

        $data["exchSign"] = $data["destAmountSign"] . "/" . $data["srcAmountSign"];
        $data["exchValue"] = round($tr["dest_amount"] / $tr["src_amount"], 5);
        $backExchSign = $data["srcAmountSign"] . "/" . $data["destAmountSign"];
        $backExchValue = round($tr["src_amount"] / $tr["dest_amount"], 5);

        $rtExchange = $data["exchValue"] . " " . $data["exchSign"];
        if ($data["exchValue"] != 1) {
            $rtExchange .= " (" . $backExchValue . " " . $backExchSign . ")";
        }

        if ($tr["type"] != DEBT) {
            $srcResBalance = ($src) ? $src->balance : null;
            $destResBalance = ($dest) ? $dest->balance : null;

            $rtSrcResBal = ($src) ? $this->currModel->format($src->balance, $src->curr_id) : null;
            $rtDestResBal = ($dest) ? $this->currModel->format($dest->balance, $dest->curr_id) : null;
        } else {
            $acc_res_balance = ($debtAcc && !$noAccount) ? $debtAcc->balance : null;
            $srcResBalance = ($give) ? $person_res_balance : $acc_res_balance;
            $destResBalance = ($give) ? $acc_res_balance : $person_res_balance;
            $rtSrcResBal = $this->currModel->format($srcResBalance, $srcAmountCurr);
            $rtDestResBal = $this->currModel->format($destResBalance, $destAmountCurr);
        }
        $data["srcResBalance"] = $srcResBalance;
        $data["destResBalance"] = $destResBalance;

        $data["srcAmountInfo"] = [
            "id" => "src_amount_left",
            "title" => $data["srcAmountLbl"],
            "value" => $this->currModel->format($tr["src_amount"], $srcAmountCurr),
            "hidden" => true
        ];
        $data["destAmountInfo"] = [
            "id" => "dest_amount_left",
            "title" => $data["destAmountLbl"],
            "value" => $this->currModel->format($tr["dest_amount"], $destAmountCurr),
            "hidden" => true
        ];
        $data["srcResultInfo"] = [
            "id" => "src_res_balance_left",
            "title" => "Result balance",
            "value" => $rtSrcResBal,
            "hidden" => false
        ];
        $data["destResultInfo"] = [
            "id" => "dest_res_balance_left",
            "title" => "Result balance",
            "value" => $rtDestResBal,
            "hidden" => false
        ];
        $data["exchangeInfo"] = [
            "id" => "exch_left",
            "title" => "Exchange rate",
            "value" => $rtExchange,
            "hidden" => ($tr["src_curr"] == $tr["dest_curr"])
        ];

        $data["dateFmt"] = date("d.m.Y", $tr["date"]);

        $data["headString"] = ($tr["type"] == DEBT)
            ? "Edit debt"
            : "Edit transaction";

        $data["titleString"] = "Jezve Money | " . $data["headString"];

        $viewData = [
            "mode" => $this->action,
            "profile" => $profileData,
            "transaction" => $tr,
            "accounts" => $this->accModel->getData(["type" => "all", "full" => true]),
            "currency" => $this->currModel->getData(),
            "icons" => $iconModel->getData()
        ];
        if ($tr["type"] == DEBT) {
            $viewData["persons"] = $this->personMod->getData(["type" => "all"]);
        }
        $data["viewData"] = JSON::encode($viewData);

        $this->cssArr[] = "TransactionView.css";
        $this->jsArr[] = "TransactionView.js";

        $this->render($data);
    }


    protected function createTransaction()
    {
        if (!$this->isPOST()) {
            setLocation(BASEURL);
        }

        if (!isset($_POST["type"])) {
            $this->fail();
        }

        $trans_type = intval($_POST["type"]);

        $defMsg = ($trans_type == DEBT) ? ERR_DEBT_CREATE : ERR_TRANS_CREATE;

        $reqData = checkFields($_POST, ($trans_type == DEBT) ? $this->debtRequiredFields : $this->requiredFields);
        if ($reqData === false) {
            $this->fail();
        }

        if ($trans_type == DEBT) {
            $debtMod = DebtModel::getInstance();
            if (!$debtMod->create($reqData)) {
                $this->fail($defMsg);
            }

            Message::set(MSG_DEBT_CREATE);
        } else {
            if (!$this->model->create($reqData)) {
                $this->fail($defMsg);
            }

            Message::set(MSG_TRANS_CREATE);
        }

        setLocation(BASEURL);
    }


    protected function updateTransaction()
    {
        if (!$this->isPOST()) {
            setLocation(BASEURL);
        }

        if (!isset($_POST["id"]) || !isset($_POST["type"])) {
            $this->fail();
        }

        $trans_type = intval($_POST["type"]);

        $defMsg = ($trans_type == DEBT) ? ERR_DEBT_UPDATE : ERR_TRANS_UPDATE;

        $reqData = checkFields($_POST, ($trans_type == DEBT) ? $this->debtRequiredFields : $this->requiredFields);
        if ($reqData === false) {
            $this->fail();
        }

        if ($trans_type == DEBT) {
            $debtMod = DebtModel::getInstance();
            if (!$debtMod->update($_POST["id"], $reqData)) {
                $this->fail($defMsg);
            }
            Message::set(MSG_DEBT_UPDATE);
        } else {
            if (!$this->model->update($_POST["id"], $reqData)) {
                $this->fail($defMsg);
            }
            Message::set(MSG_TRANS_UPDATE);
        }

        setLocation(BASEURL . "transactions/");
    }


    public function del()
    {
        if (!$this->isPOST()) {
            setLocation(BASEURL . "transactions/");
        }

        $defMsg = ERR_TRANS_DELETE;

        if (!isset($_POST["transactions"])) {
            $this->fail($defMsg);
        }

        $ids = explode(",", rawurldecode($_POST["transactions"]));
        if (!$this->model->del($ids)) {
            $this->fail();
        }

        Message::set(MSG_TRANS_DELETE);
        setLocation(BASEURL . "transactions/");
    }
}
