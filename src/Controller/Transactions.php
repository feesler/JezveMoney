<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\IconModel;
use JezveMoney\App\Model\TransactionModel;
use JezveMoney\App\Item\TransactionItem;

const MSG_ACCOUNT_NOT_AVAILABLE = "You have no one active account. Please create one.";
const MSG_TRANSFER_NOT_AVAILABLE = "You need at least two active accounts for transfer.";
const MSG_DEBT_NOT_AVAILABLE = "You have no one active person. Please create one for debts.";

class Transactions extends TemplateController
{
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
        $this->template = new Template(VIEW_TPL_PATH . "TransactionList.tpl");
        $baseUrl = BASEURL . "transactions/";
        $data = [
            "titleString" => "Jezve Money | Transactions",
            "clearAllURL" => $baseUrl
        ];

        $pagination = [
            "onPage" => 10,
            "page" => 1,
            "pagesCount" => 1,
            "total" => 0,
        ];
        $trParamsDefault = [
            "onPage" => 10,
            "desc" => true
        ];

        $trParams = $this->model->getRequestFilters($_GET, $trParamsDefault);
        $filterObj = $this->model->getFilterObject($trParams);

        $data["accFilter"] = isset($trParams["accounts"]) ? $trParams["accounts"] : [];
        $data["personFilter"] = isset($trParams["persons"]) ? $trParams["persons"] : [];
        $data["searchReq"] = isset($trParams["search"]) ? $trParams["search"] : null;

        $dateFmt = "";
        if (isset($trParams["startDate"]) && $trParams["endDate"]) {
            $sdate = strtotime($trParams["startDate"]);
            $edate = strtotime($trParams["endDate"]);
            if ($sdate != -1 && $edate != -1) {
                $dateFmt = date("d.m.Y", $sdate) . " - " . date("d.m.Y", $edate);
            }
        }
        $data["dateFmt"] = $dateFmt;

        // Obtain requested view mode
        $showDetails = false;
        if (isset($_GET["mode"]) && $_GET["mode"] == "details") {
            $showDetails = true;
        }
        $data["showDetails"] = $showDetails;

        $transArr = $this->model->getData($trParams);

        $transCount = $this->model->getTransCount($trParams);
        $pagination["total"] = $transCount;

        // Prepare transaction types menu
        $trTypes = [0 => "Show all"];
        $availTypes = TransactionModel::getTypeNames();
        array_push($trTypes, ...$availTypes);

        $transMenu = [];
        foreach ($trTypes as $type_id => $trTypeName) {
            $urlParams = $filterObj;
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
                $menuItem->selected = !isset($filterObj["type"]) || !count($filterObj["type"]);
            } else {
                $menuItem->selected = isset($filterObj["type"]) && in_array($type_id, $filterObj["type"]);
            }
            $menuItem->url = urlJoin($baseUrl, $urlParams);

            $transMenu[] = $menuItem;
        }
        $data["transMenu"] = $transMenu;

        // Build data for paginator
        if ($trParams["onPage"] > 0) {
            $pageCount = ceil($transCount / $trParams["onPage"]);
            $pagination["pagesCount"] = $pageCount;
            $page_num = isset($trParams["page"]) ? intval($trParams["page"]) : 0;
            $pagination["page"] = $page_num + 1;
        }

        // Prepare data of transaction list items
        $trItems = [];
        foreach ($transArr as $trans) {
            $trItems[] = new TransactionItem($trans);
        }

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->accModel->getData(["full" => true, "type" => "all"]),
            "persons" => $this->personMod->getData(["type" => "all"]),
            "currency" => $this->currModel->getData(),
            "view" => [
                "transArr" => $trItems,
                "filterObj" => (object)$filterObj,
                "pagination" => $pagination,
                "mode" => $showDetails ? "details" : "classic",
            ],
        ];

        $this->cssArr[] = "TransactionListView.css";
        $this->jsArr[] = "TransactionListView.js";

        $this->render($data);
    }


    protected function fail($msg = null)
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


    protected function getRequestedType($request, $default)
    {
        if (!is_array($request) || !isset($request["type"])) {
            return $default;
        }
        $res = intval($request["type"]);
        if (!$res) {
            $res = TransactionModel::stringToType($request["type"]);
        }
        if (!$res) {
            $this->fail("Invalid transaction type");
        }

        return $res;
    }


    protected function getTypeMenu($baseUrl, $selectedType, $params = [])
    {
        $trTypes = TransactionModel::getTypeNames();
        $res = [];
        foreach ($trTypes as $type_id => $trTypeName) {
            $urlParams = $params;
            $urlParams["type"] = strtolower($trTypeName);

            $menuItem = new \stdClass();
            $menuItem->type = $type_id;
            $menuItem->title = $trTypeName;
            $menuItem->selected = ($type_id == $selectedType);
            $menuItem->url = urlJoin($baseUrl, $urlParams);

            $res[] = $menuItem;
        }

        return $res;
    }


    public function create()
    {
        if ($this->isPOST()) {
            $this->fail(ERR_INVALID_REQUEST);
        }

        $this->template = new Template(VIEW_TPL_PATH . "Transaction.tpl");
        $data = [
            "action" => "create",
        ];
        $form = [];

        $userAccounts = $this->accModel->getUserAccounts();
        $acc_count = count($userAccounts);
        $data["acc_count"] = $acc_count;

        $persons = $this->personMod->getData(["type" => "all", "sort" => "visibility"]);
        $iconModel = IconModel::getInstance();
        $defMsg = ERR_TRANS_CREATE;

        $tr = [
            "type" => $this->getRequestedType($_GET, EXPENSE),
            "src_amount" => 0,
            "dest_amount" => 0,
            "comment" => "",
            "date" => strtotime(date("d.m.Y"))
        ];

        // Check availability of selected type of transaction
        $noDataMessage = null;
        if ($tr["type"] == EXPENSE || $tr["type"] == INCOME) {
            $trAvailable = $acc_count > 0;
            $noDataMessage = MSG_ACCOUNT_NOT_AVAILABLE;
        } elseif ($tr["type"] == TRANSFER) {
            $trAvailable = $acc_count > 1;
            $noDataMessage = MSG_TRANSFER_NOT_AVAILABLE;
        } elseif ($tr["type"] == DEBT) {
            $trAvailable = is_array($persons) && count($persons) > 0;
            $noDataMessage = MSG_DEBT_NOT_AVAILABLE;
        }
        $data["trAvailable"] = $trAvailable;
        $data["noDataMessage"] = $noDataMessage;

        // Check specified account
        $acc_id = 0;
        if (isset($_GET["acc_id"])) {
            $acc_id = intval($_GET["acc_id"]);
        }
        // Redirect if invalid account is specified
        if ($acc_id) {
            $account = $this->accModel->getItem($acc_id);
            if (!$account || $account->owner_id != $this->owner_id) {
                $this->fail($defMsg);
            }
        }
        // Use first account if nothing is specified
        if (!$acc_id && count($userAccounts) > 0) {
            $acc_id = $userAccounts[0]->id;
        }
        $data["acc_id"] = $acc_id;

        // Check person parameter
        $person_id = 0;
        $pObj = null;
        if (isset($_GET["person_id"]) && $tr["type"] == DEBT) {
            $person_id = intval($_GET["person_id"]);
        }
        if ($person_id) {
            $pObj = $this->personMod->getItem($person_id);
            if (!$pObj) {
                $this->fail($defMsg);
            }
        }
        if (!$person_id && count($persons) > 0) {
            $person_id = $persons[0]->id;
            $pObj = $this->personMod->getItem($person_id);
        }

        $debtType = true;
        $noAccount = $acc_id == 0;
        $debtAcc = $this->accModel->getItem($acc_id);

        // Prepare person account
        $person_curr = ($debtAcc) ? $debtAcc->curr_id : $this->currModel->getIdByPos(0);
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

        if ($tr["type"] == DEBT && $debtAcc) {
            $data["debtAccountTile"] = $this->getAccountTileData($debtAcc, "acc_tile");
        } else {
            $data["debtAccountTile"] = $this->getHiddenAccountTileData("acc_tile");
        }

        if ($tr["type"] == DEBT) {
            $tr["src_id"] = $person_acc_id;
            $tr["dest_id"] = $acc_id;
            $tr["src_curr"] = ($debtAcc) ? $debtAcc->curr_id : $person_curr;
            $tr["dest_curr"] = ($debtAcc) ? $debtAcc->curr_id : $person_curr;
            $tr["person_id"] = $person_id;
            $tr["debtType"] = $debtType;
            $tr["lastAcc_id"] = $acc_id;
            $tr["noAccount"] = $data["noAccount"];
        } else {
            // set source and destination accounts
            $src_id = 0;
            $dest_id = 0;
            if ($tr["type"] == EXPENSE || $tr["type"] == TRANSFER) {
                $src_id = ($acc_id ? $acc_id : $this->accModel->getAnother());
            } elseif ($tr["type"] == INCOME) {       // income
                $dest_id = ($acc_id ? $acc_id : $this->accModel->getAnother());
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

            if ($tr["type"] == TRANSFER && !$trAvailable) {
                $tr["dest_curr"] = $tr["src_curr"];
            }
        }
        $data["tr"] = $tr;
        $isDiffCurr = ($tr["src_curr"] != $tr["dest_curr"]);

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
        $menuParams = [];
        if ($acc_id != 0) {
            $menuParams["acc_id"] = $acc_id;
        }
        $baseUrl = BASEURL . "transactions/create/";
        $data["transMenu"] = $this->getTypeMenu($baseUrl, $tr["type"], $menuParams);

        $form["action"] = BASEURL . "transactions/" . $data["action"] . "/";

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

        /**
         * Show destination amount input for expense and source amount input for income by default,
         * because it's amount with changing currency.
         * Meanwhile source amount for expense and destination amount for income are
         * always have the same currency as account.
         */
        if ($tr["type"] == EXPENSE) {
            $showSrcAmount = $isDiffCurr;
            $showDestAmount = true;
        } elseif ($tr["type"] == INCOME || $tr["type"] == TRANSFER) {
            $showSrcAmount = true;
            $showDestAmount = $isDiffCurr;
        } elseif ($tr["type"] == DEBT) {
            $showSrcAmount = true;
            $showDestAmount = false;
        }

        $form["src_amount"] = "";
        $form["dest_amount"] = "";

        $data["showSrcAmount"] = $showSrcAmount;
        $data["showDestAmount"] = $showDestAmount;

        $showBothAmounts = $showSrcAmount && $showDestAmount;
        $data["srcAmountLbl"] = ($showBothAmounts) ? "Source amount" : "Amount";
        $data["destAmountLbl"] = ($showBothAmounts) ? "Destination amount" : "Amount";

        if ($noAccount) {
            $data["accLbl"] = "No account";
        } else {
            $data["accLbl"] = ($debtType) ? "Destination account" : "Source account";
        }

        $currObj = $this->currModel->getItem($tr["src_curr"]);
        $srcAmountSign = $currObj ? $currObj->sign : null;
        $form["srcCurrSign"] = $srcAmountSign;

        $currObj = $this->currModel->getItem($tr["dest_curr"]);
        $destAmountSign = $currObj ? $currObj->sign : null;
        $form["destCurrSign"] = $destAmountSign;

        $form["exchSign"] = $destAmountSign . "/" . $srcAmountSign;
        $form["exchange"] = 1;

        if ($tr["type"] != DEBT) {
            $srcResBalance = ($src) ? $src->balance : 0;
            $destResBalance = ($dest) ? $dest->balance : 0;

            $rtSrcResBal = $src ? $this->currModel->format($src->balance, $src->curr_id) : null;
            $rtDestResBal = $dest ? $this->currModel->format($dest->balance, $dest->curr_id) : null;
        } else {
            $acc_res_balance = ($debtAcc) ? $debtAcc->balance : 0;

            $srcResBalance = ($debtType) ? $person_res_balance : $acc_res_balance;
            $destResBalance = ($debtType) ? $acc_res_balance : $person_res_balance;

            $rtSrcResBal = $this->currModel->format($srcResBalance, $tr["src_curr"]);
            $rtDestResBal = $this->currModel->format($destResBalance, $tr["dest_curr"]);
        }
        $form["srcResult"] = $srcResBalance;
        $form["destResult"] = $destResBalance;

        $data["form"] = $form;

        $data["srcAmountInfo"] = [
            "id" => "src_amount_left",
            "title" => $data["srcAmountLbl"],
            "value" => $this->currModel->format($tr["src_amount"], $tr["src_curr"]),
            "hidden" => true
        ];
        $data["destAmountInfo"] = [
            "id" => "dest_amount_left",
            "title" => $data["destAmountLbl"],
            "value" => $this->currModel->format($tr["dest_amount"], $tr["dest_curr"]),
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
            "value" => $form["exchange"] . " " . $form["exchSign"],
            "hidden" => ($tr["src_curr"] == $tr["dest_curr"])
        ];

        $data["dateFmt"] = date("d.m.Y");

        $data["headString"] = "Create transaction";
        $data["titleString"] = "Jezve Money | " . $data["headString"];

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->accModel->getData(["type" => "all", "full" => true]),
            "currency" => $this->currModel->getData(),
            "icons" => $iconModel->getData(),
            "persons" => $this->personMod->getData(["type" => "all"]),
            "view" => [
                "mode" => $this->action,
                "transaction" => $tr,
                "trAvailable" => $trAvailable,
            ],
        ];

        $this->cssArr[] = "TransactionView.css";
        $this->jsArr[] = "TransactionView.js";

        $this->render($data);
    }


    public function update()
    {
        if ($this->isPOST()) {
            $this->fail(ERR_INVALID_REQUEST);
        }

        $this->template = new Template(VIEW_TPL_PATH . "Transaction.tpl");
        $data = [
            "action" => "update",
        ];
        $form = [];

        $visiblePersons = $this->personMod->getData();
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
        $isDiffCurr = ($tr["src_curr"] != $tr["dest_curr"]);

        // check type change request
        $requestedType = $this->getRequestedType($_GET, $tr["type"]);

        $data["acc_count"] = $this->accModel->getCount(["full" => ($tr["type"] == DEBT)]);

        $noDataMessage = null;
        $data["noDataMessage"] = $noDataMessage;
        $trAvailable = true;
        $data["trAvailable"] = $trAvailable;

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
        $baseUrl = $baseUrl = BASEURL . "transactions/update/" . $trans_id;
        $data["transMenu"] = $this->getTypeMenu($baseUrl, $tr["type"]);

        $form["action"] = BASEURL . "transactions/" . $data["action"] . "/";

        if ($tr["type"] == EXPENSE) {
            $showSrcAmount = $isDiffCurr;
            $showDestAmount = true;
        } elseif ($tr["type"] == INCOME || $tr["type"] == TRANSFER) {
            $showSrcAmount = true;
            $showDestAmount = $isDiffCurr;
        } elseif ($tr["type"] == DEBT) {
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
                $acc_id = $this->accModel->getAnother();
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

            $acc_id = $this->accModel->getAnother();
            $debtAcc = $this->accModel->getItem($acc_id);

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

        $form["src_amount"] = $tr["src_amount"];
        $form["dest_amount"] = $tr["dest_amount"];

        $data["showSrcAmount"] = $showSrcAmount;
        $data["showDestAmount"] = $showDestAmount;
        $data["srcBalTitle"] = $srcBalTitle;
        $data["destBalTitle"] = $destBalTitle;

        $data["person_id"] = $person_id;
        $data["debtType"] = $debtType;
        $data["noAccount"] = $noAccount;

        $data["personTile"] = [
            "id" => "person_tile",
            "title" => ($pObj) ? $pObj->name : null,
            "subtitle" => $this->currModel->format($person_balance, $person_curr),
        ];

        $data["tr"] = $tr;

        $showBothAmounts = $showSrcAmount && $showDestAmount;
        $data["srcAmountLbl"] = ($showBothAmounts) ? "Source amount" : "Amount";
        $data["destAmountLbl"] = ($showBothAmounts) ? "Destination amount" : "Amount";

        if ($noAccount) {
            $data["accLbl"] = "No account";
        } else {
            $data["accLbl"] = ($debtType) ? "Destination account" : "Source account";
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

        $currObj = $this->currModel->getItem($tr["src_curr"]);
        $form["srcCurrSign"] = $currObj ? $currObj->sign : null;

        $currObj = $this->currModel->getItem($tr["dest_curr"]);
        $form["destCurrSign"] = $currObj ? $currObj->sign : null;

        $form["exchSign"] = $form["destCurrSign"] . "/" . $form["srcCurrSign"];
        $form["exchange"] = round($tr["dest_amount"] / $tr["src_amount"], 5);
        $backExchSign = $form["srcCurrSign"] . "/" . $form["destCurrSign"];
        $backExchValue = round($tr["src_amount"] / $tr["dest_amount"], 5);

        $rtExchange = $form["exchange"] . " " . $form["exchSign"];
        if ($form["exchange"] != 1) {
            $rtExchange .= " (" . $backExchValue . " " . $backExchSign . ")";
        }

        if ($tr["type"] != DEBT) {
            $srcResBalance = ($src) ? $src->balance : 0;
            $destResBalance = ($dest) ? $dest->balance : 0;

            $rtSrcResBal = ($src) ? $this->currModel->format($src->balance, $tr["src_curr"]) : null;
            $rtDestResBal = ($dest) ? $this->currModel->format($dest->balance, $tr["dest_curr"]) : null;
        } else {
            $acc_res_balance = ($debtAcc) ? $debtAcc->balance : 0;
            if ($noAccount) {
                $acc_res_balance += ($debtType) ? $tr["dest_amount"] : -$tr["src_amount"];
            }
            $srcResBalance = ($debtType) ? $person_res_balance : $acc_res_balance;
            $destResBalance = ($debtType) ? $acc_res_balance : $person_res_balance;
            $rtSrcResBal = $this->currModel->format($srcResBalance, $tr["src_curr"]);
            $rtDestResBal = $this->currModel->format($destResBalance, $tr["dest_curr"]);
        }
        $form["srcResult"] = $srcResBalance;
        $form["destResult"] = $destResBalance;

        $data["form"] = $form;

        $data["srcAmountInfo"] = [
            "id" => "src_amount_left",
            "title" => $data["srcAmountLbl"],
            "value" => $this->currModel->format($tr["src_amount"], $tr["src_curr"]),
            "hidden" => true
        ];
        $data["destAmountInfo"] = [
            "id" => "dest_amount_left",
            "title" => $data["destAmountLbl"],
            "value" => $this->currModel->format($tr["dest_amount"], $tr["dest_curr"]),
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
            "hidden" => !$isDiffCurr
        ];

        $data["dateFmt"] = date("d.m.Y", $tr["date"]);

        $data["headString"] = "Edit transaction";
        $data["titleString"] = "Jezve Money | " . $data["headString"];

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->accModel->getData(["type" => "all", "full" => true]),
            "currency" => $this->currModel->getData(),
            "icons" => $iconModel->getData(),
            "persons" => $this->personMod->getData(["type" => "all"]),
            "view" => [
                "mode" => $this->action,
                "transaction" => $tr,
                "trAvailable" => $trAvailable,
                "requestedType" => $requestedType,
            ],
        ];

        $this->cssArr[] = "TransactionView.css";
        $this->jsArr[] = "TransactionView.js";

        $this->render($data);
    }
}
