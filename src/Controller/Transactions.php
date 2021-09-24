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
use JezveMoney\App\Item\TransactionItem;

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
        $listData = [];

        $filterObj = new \stdClass();
        $pagination = [
            "onPage" => 10,
            "page" => 1,
            "pagesCount" => 1,
            "total" => 0,
        ];
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
            $page = intval($_GET["page"]);
            if ($page > 1) {
                $trParams["page"] = $page - 1;
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
        }
        $listData["showDetails"] = $showDetails;

        $data["accArr"] = $this->accModel->getData();
        $data["hiddenAccArr"] = $this->accModel->getData(["type" => "hidden"]);
        $data["accounts"] = $this->accModel->getCount(["type" => "all"]);

        $transArr = $this->model->getData($trParams);

        $transCount = $this->model->getTransCount($trParams);
        $pagination["total"] = $transCount;

        $currArr = $this->currModel->getData();

        // Prepare transaction types menu
        $trTypes = [0 => "Show all"];
        $availTypes = TransactionModel::getTypeNames();
        array_push($trTypes, ...$availTypes);

        $transMenu = [];
        $baseUrl = BASEURL . "transactions/";
        foreach ($trTypes as $type_id => $trTypeName) {
            $urlParams = (array)$filterObj;

            $urlParams["mode"] = ($showDetails) ? "classic" : "details";

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
        // Prepare classic/details mode link
        $urlParams = (array)$filterObj;
        $urlParams["mode"] = ($showDetails) ? "classic" : "details";

        $data["modeLink"] = urlJoin(BASEURL . "transactions/", $urlParams);

        // Build data for paginator
        if ($trParams["onPage"] > 0) {
            $urlParams = (array)$filterObj;
            $urlParams["mode"] = ($showDetails) ? "classic" : "details";

            $pageCount = ceil($transCount / $trParams["onPage"]);
            $pagination["pagesCount"] = $pageCount;
            $page_num = isset($trParams["page"]) ? intval($trParams["page"]) : 0;
            $pagination["page"] = $page_num + 1;

            $pagesArr = [];
            if ($transCount > $trParams["onPage"]) {
                $pagesArr = $this->model->getPaginatorArray($page_num, $pageCount);
            }

            foreach ($pagesArr as $ind => $item) {
                if (isset($item["page"]) && !$item["active"]) {
                    $urlParams["page"] = intval($item["page"]);

                    $pagesArr[$ind]["link"] = urlJoin(BASEURL . "transactions/", $urlParams);
                }
            }
        }
        $data["paginator"] = ["pagesArr" => $pagesArr];

        // Prepare data of transaction list items
        $trListData = [];
        $trItems = [];
        foreach ($transArr as $trans) {
            $itemData = $this->model->getListItem($trans, $showDetails);
            $trListData[] = $itemData;

            $trItems[] = new TransactionItem($trans);
        }
        $listData["items"] = $trListData;

        $data["listData"] = $listData;
        $profileData = [
            "user_id" => $this->user_id,
            "owner_id" => $this->owner_id,
            "name" => $this->user_name,
        ];
        $data["viewData"] = JSON::encode([
            "profile" => $profileData,
            "accounts" => $this->accModel->getData(["full" => true, "type" => "all"]),
            "persons" => $this->personMod->getData(["type" => "all"]),
            "currency" => $currArr,
            "transArr" => $trItems,
            "filterObj" => $filterObj,
            "pagination" => $pagination,
            "mode" => $showDetails ? "details" : "classic",
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


    protected function getHiddenAccountTileData($tileId)
    {
        return [
            "id" => $tileId,
            "title" => "",
            "subtitle" => "",
            "icon" => "",
        ];
    }


    protected function getAccountTileData($account, $tileId, $balanceDiff = 0)
    {
        return [
            "id" => $tileId,
            "title" => $account->name,
            "subtitle" => $this->currModel->format($account->balance + $balanceDiff, $account->curr_id),
            "icon" => $this->accModel->getIconFile($account->id),
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
            $tr["type"] = intval($_GET["type"]);
            if (!$tr["type"]) {
                $tr["type"] = TransactionModel::stringToType($_GET["type"]);
            }
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

        $debtType = true;
        $noAccount = false;
        $srcAmountCurr = 0;
        $destAmountCurr = 0;
        $debtAcc = $this->accModel->getItem($acc_id);

        // Prepare person account
        $visiblePersons = $this->personMod->getData();
        $person_id = (is_array($visiblePersons) && count($visiblePersons) > 0)
            ? $visiblePersons[0]->id
            : 0;
        $pObj = $this->personMod->getItem($person_id);
        $person_curr = $debtAcc->curr_id;
        $person_acc = $this->accModel->getPersonAccount($person_id, $person_curr);
        $person_acc_id = ($person_acc) ? $person_acc->id : 0;
        $person_res_balance = ($person_acc) ? $person_acc->balance : 0.0;
        $person_balance = $person_res_balance;

        $data["person_id"] = $person_id;
        $data["debtType"] = $debtType;
        $data["noAccount"] = $noAccount;

        $data["acc_id"] = ($debtAcc) ? $debtAcc->id : 0;

        $data["personTile"] = [
            "id" => "person_tile",
            "title" => ($pObj) ? $pObj->name : null,
            "subtitle" => $this->currModel->format($person_balance, $person_curr)
        ];

        if ($tr["type"] == DEBT) {
            $data["debtAccountTile"] = $this->getAccountTileData($debtAcc, "acc_tile");
        } else {
            $data["debtAccountTile"] = $this->getHiddenAccountTileData("acc_tile");
        }

        if ($tr["type"] == DEBT) {
            $tr["src_id"] = $person_acc_id;
            $tr["dest_id"] = $acc_id;
            $tr["src_curr"] = $debtAcc->curr_id;
            $tr["dest_curr"] = $debtAcc->curr_id;
            $tr["person_id"] = $person_id;
            $tr["debtType"] = $debtType;
            $tr["lastAcc_id"] = $acc_id;
            $tr["noAccount"] = $data["noAccount"];
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

        // get information about source and destination accounts
        $src = $this->accModel->getItem($tr["src_id"]);
        if ($src) {
            $data["srcAccountTile"] = $this->getAccountTileData($src, "source_tile");
        } else {
            $data["srcAccountTile"] = $this->getHiddenAccountTileData("source_tile");
        }

        $dest = $this->accModel->getItem($tr["dest_id"]);
        if ($dest) {
            $data["destAccountTile"] = $this->getAccountTileData($dest, "dest_tile");
        } else {
            $data["destAccountTile"] = $this->getHiddenAccountTileData("dest_tile");
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
            $menuItem->selected = ($type_id == $tr["type"]);
            $menuItem->url = urlJoin($baseUrl, $params);

            $transMenu[] = $menuItem;
        }
        $data["transMenu"] = $transMenu;

        $data["formAction"] = BASEURL . "transactions/" . $action . "/";

        $srcBalTitle = "Result balance";
        if ($tr["type"] == TRANSFER) {
            $srcBalTitle .= " (Source)";
        } elseif ($tr["type"] == DEBT) {
            $srcBalTitle .= ($debtType) ? " (Person)" : " (Account)";
        }
        $data["srcBalTitle"] = $srcBalTitle;

        $balDiff = $tr["src_amount"];
        if ($tr["type"] != DEBT && !is_null($src)) {
            $src->balfmt = $this->currModel->format($src->balance + $balDiff, $src->curr_id);
            $src->icon = $this->accModel->getIconFile($src->id);
        }

        $destBalTitle = "Result balance";
        if ($tr["type"] == TRANSFER) {
            $destBalTitle .= " (Destination)";
        } elseif ($tr["type"] == DEBT) {
            $destBalTitle .= ($debtType) ? " (Account)" : " (Person)";
        }
        $data["destBalTitle"] = $destBalTitle;

        $balDiff = $tr["dest_amount"];
        if ($tr["type"] != DEBT && !is_null($dest)) {
            $dest->balfmt = $this->currModel->format($dest->balance - $balDiff, $dest->curr_id);
            $dest->icon = $this->accModel->getIconFile($dest->id);
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

        if ($noAccount) {
            $data["accLbl"] = "No account";
        } else {
            $data["accLbl"] = ($debtType) ? "Destination account" : "Source account";
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
            $acc_res_balance = ($debtAcc) ? $debtAcc->balance : null;

            $srcResBalance = ($debtType) ? $person_res_balance : $acc_res_balance;
            $destResBalance = ($debtType) ? $acc_res_balance : $person_res_balance;

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

        $data["headString"] = "New transaction";
        $data["titleString"] = "Jezve Money | " . $data["headString"];

        $viewData = [
            "mode" => $this->action,
            "profile" => $profileData,
            "transaction" => $tr,
            "accounts" => $this->accModel->getData(["type" => "all", "full" => true]),
            "currency" => $this->currModel->getData(),
            "icons" => $iconModel->getData(),
            "persons" => $this->personMod->getData(["type" => "all"]),
        ];
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

        // get information about source and destination accounts
        $src = $this->accModel->getItem($tr["src_id"]);
        if ($src) {
            $data["srcAccountTile"] = $this->getAccountTileData($src, "source_tile", $tr["src_amount"]);
        } else {
            $data["srcAccountTile"] = $this->getHiddenAccountTileData("source_tile");
        }

        $dest = $this->accModel->getItem($tr["dest_id"]);
        if ($dest) {
            $data["destAccountTile"] = $this->getAccountTileData($dest, "dest_tile", -$tr["dest_amount"]);
        } else {
            $data["destAccountTile"] = $this->getHiddenAccountTileData("dest_tile");
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

        $srcAmountCurr = $tr["src_curr"];
        $destAmountCurr = $tr["dest_curr"];
        if ($tr["type"] != DEBT) {
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
            $showSrcAmount = true;
            $showDestAmount = false;
        }

        if ($tr["type"] == DEBT) {
            $uObj = $this->uMod->getItem($this->user_id);
            if (!$uObj) {
                throw new \Error("User not found");
            }

            $debtType = (!is_null($src) && $src->owner_id != $uObj->owner_id);

            $person_id = ($debtType) ? $src->owner_id : $dest->owner_id;

            $pObj = $this->personMod->getItem($person_id);
            if (!$pObj) {
                throw new \Error("Person not found");
            }

            $person_acc_id = ($debtType) ? $tr["src_id"] : $tr["dest_id"];
            $person_acc = $this->accModel->getItem($person_acc_id);
            $person_curr = $person_acc->curr_id;
            $person_res_balance = $person_acc->balance;
            $person_balance = $person_res_balance + (($debtType) ? $tr["src_amount"] : -$tr["dest_amount"]);

            $debtAcc = $debtType ? $dest : $src;
            $noAccount = is_null($debtAcc);

            if ($noAccount) {
                $destAmountCurr = $person_acc->curr_id;

                $acc_id = $this->accModel->getIdByPos(0);
                $debtAcc = $this->accModel->getItem($acc_id);
                if (!$debtAcc) {
                    throw new \Error("Account " . $acc_id . " not found");
                }
            } else {
                $acc_id = $debtAcc->id;
            }

            $tr["person_id"] = $person_id;
            $tr["debtType"] = $debtType;
            $tr["lastAcc_id"] = $acc_id;
            $tr["noAccount"] = $noAccount;
        } else {
            $debtType = true;
            $noAccount = false;

            $acc_id = $this->accModel->getIdByPos(0);
            $debtAcc = $this->accModel->getItem($acc_id);

            $visiblePersons = $this->personMod->getData();
            $person_id = (is_array($visiblePersons) && count($visiblePersons) > 0)
                ? $visiblePersons[0]->id
                : 0;
            $pObj = $this->personMod->getItem($person_id);

            $person_curr = $tr["src_curr"];
            $person_acc = $this->accModel->getPersonAccount($person_id, $person_curr);
            $person_acc_id = ($person_acc) ? $person_acc->id : 0;
            $person_res_balance = ($person_acc) ? $person_acc->balance : 0.0;
            $person_balance = $person_res_balance;
        }

        $srcBalTitle = "Result balance";
        if ($tr["type"] == TRANSFER) {
            $srcBalTitle .= " (Source)";
        } elseif ($tr["type"] == DEBT) {
            $srcBalTitle .= ($debtType) ? " (Person)" : " (Account)";
        }

        $destBalTitle = "Result balance";
        if ($tr["type"] == TRANSFER) {
            $destBalTitle .= " (Destination)";
        } elseif ($tr["type"] == DEBT) {
            $destBalTitle .= ($debtType) ? " (Account)" : " (Person)";
        }

        $data["srcAmountCurr"] = $srcAmountCurr;
        $data["showSrcAmount"] = $showSrcAmount;
        $data["destAmountCurr"] = $destAmountCurr;
        $data["showDestAmount"] = $showDestAmount;
        $data["srcBalTitle"] = $srcBalTitle;
        $data["destBalTitle"] = $destBalTitle;

        $data["person_id"] = $person_id;
        $data["debtType"] = $debtType;
        $data["noAccount"] = $noAccount;

        $data["personTile"] = [
            "id" => "person_tile",
            "title" => $pObj->name,
            "subtitle" => $this->currModel->format($person_balance, $person_curr),
        ];

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

        if ($noAccount) {
            $accLbl = "No account";
        } else {
            $accLbl = ($debtType) ? "Destination account" : "Source account";
        }

        if ($tr["type"] == DEBT && $debtAcc) {
            $balanceDiff = 0;
            if (!$noAccount) {
                $balanceDiff = ($debtType) ? -$tr["dest_amount"] : $tr["src_amount"];
            }

            $data["debtAccountTile"] = $this->getAccountTileData($debtAcc, "acc_tile", $balanceDiff);
        } else {
            $data["debtAccountTile"] = $this->getHiddenAccountTileData("acc_tile");
        }

        $data["acc_id"] = ($debtAcc) ? $debtAcc->id : 0;
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
            $acc_res_balance = ($debtAcc) ? $debtAcc->balance : 0;
            $srcResBalance = ($debtType) ? $person_res_balance : $acc_res_balance;
            $destResBalance = ($debtType) ? $acc_res_balance : $person_res_balance;
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

        $data["headString"] = "Edit transaction";
        $data["titleString"] = "Jezve Money | " . $data["headString"];

        $viewData = [
            "mode" => $this->action,
            "profile" => $profileData,
            "transaction" => $tr,
            "accounts" => $this->accModel->getData(["type" => "all", "full" => true]),
            "currency" => $this->currModel->getData(),
            "icons" => $iconModel->getData(),
            "persons" => $this->personMod->getData(["type" => "all"]),
        ];
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
