<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\IconModel;
use JezveMoney\App\Model\TransactionModel;
use JezveMoney\App\Model\CategoryModel;

/**
 * Transactions controller
 */
class Transactions extends TemplateController
{
    protected $model = null;
    protected $accModel = null;
    protected $currModel = null;
    protected $catModel = null;

    /**
     * Controller initialization
     */
    protected function onStart()
    {
        $this->model = TransactionModel::getInstance();
        $this->accModel = AccountModel::getInstance();
        $this->currModel = CurrencyModel::getInstance();
        $this->catModel = CategoryModel::getInstance();
    }

    /**
     * /transactions/ route handler
     * Renders transactions list view
     */
    public function index()
    {
        $this->template = new Template(VIEW_TPL_PATH . "TransactionList.tpl");
        $baseUrl = BASEURL . "transactions/";
        $data = [
            "titleString" => __("APP_NAME") . " | " . __("TRANSACTIONS"),
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
        $data["dateRange"] = [
            "id" => "dateFrm",
            "start" => ($filterObj["stdate"] ?? null),
            "end" => ($filterObj["enddate"] ?? null)
        ];

        // Obtain requested view mode
        $showDetails = false;
        if (isset($_GET["mode"]) && $_GET["mode"] == "details") {
            $showDetails = true;
        }
        $data["showDetails"] = $showDetails;

        $transactions = $this->model->getData($trParams);

        $transCount = $this->model->getTransCount($trParams);
        $pagination["total"] = $transCount;

        // Prepare transaction types menu
        $trTypes = [0 => __("SHOW_ALL")];
        $availTypes = TransactionModel::getTypeNames();
        array_push($trTypes, ...$availTypes);

        $typeMenu = [];
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

            if ($type_id == 0) {
                $selected = !isset($filterObj["type"]) || !count($filterObj["type"]);
            } else {
                $selected = isset($filterObj["type"]) && in_array($type_id, $filterObj["type"]);
            }

            $item = [
                "title" => $trTypeName,
                "selected" => $selected,
                "url" => urlJoin($baseUrl, $urlParams)
            ];

            if ($type_id != 0) {
                $item["value"] = $type_id;
            }
            $typeMenu[] = $item;
        }
        $data["typeMenu"] = $typeMenu;

        // Build data for paginator
        if ($trParams["onPage"] > 0) {
            $pageCount = ceil($transCount / $trParams["onPage"]);
            $pagination["pagesCount"] = $pageCount;
            $page_num = isset($trParams["page"]) ? intval($trParams["page"]) : 0;
            $pagination["page"] = $page_num + 1;
        }

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->accModel->getData(["owner" => "all", "visibility" => "all"]),
            "persons" => $this->personMod->getData(["visibility" => "all"]),
            "currency" => $this->currModel->getData(),
            "categories" => $this->catModel->getData(),
            "view" => [
                "transArr" => $transactions,
                "filter" => (object)$filterObj,
                "pagination" => $pagination,
                "mode" => $showDetails ? "details" : "classic",
            ],
        ];

        $this->cssArr[] = "TransactionListView.css";
        $this->jsArr[] = "TransactionListView.js";

        $this->render($data);
    }

    /**
     * Controller error handler
     *
     * @param string|null $msg message string
     */
    protected function fail(?string $msg = null)
    {
        if (!is_null($msg)) {
            Message::setError($msg);
        }

        setLocation(BASEURL);
    }

    /**
     * Returns properties for hidden Tile
     *
     * @param string $tileId tile id
     *
     * @return array
     */
    protected function getHiddenAccountTileData(string $tileId)
    {
        return [
            "id" => $tileId,
            "title" => "",
            "subtitle" => "",
            "icon" => "",
        ];
    }

    /**
     * Returns properties for account Tile
     *
     * @param object $account
     * @param string $tileId tile id
     * @param float $balanceDiff difference to add to account balance
     *
     * @return array
     */
    protected function getAccountTileData(object $account, string $tileId, float $balanceDiff = 0)
    {
        return [
            "id" => $tileId,
            "title" => $account->name,
            "subtitle" => $this->currModel->format($account->balance + $balanceDiff, $account->curr_id),
            "icon" => $this->accModel->getIconFile($account->id),
        ];
    }

    /**
     * Returns transaction type from request
     *
     * @param array $request request data
     * @param int $default default transaction type
     *
     * @return int
     */
    protected function getRequestedType(array $request, int $default)
    {
        if (!is_array($request) || !isset($request["type"])) {
            return $default;
        }
        $res = intval($request["type"]);
        if (!$res) {
            $res = TransactionModel::stringToType($request["type"]);
        }
        if (!$res) {
            $this->fail(__("ERR_TRANSACTION_TYPE"));
        }

        return $res;
    }

    /**
     * Retunrs properties for transaction type menu
     *
     * @param string $baseUrl
     * @param int $selectedType
     * @param array $params
     *
     * @return array
     */
    protected function getTypeMenu(string $baseUrl, int $selectedType, array $params = [])
    {
        $trTypes = TransactionModel::getTypeNames();
        $acc_id = (is_array($params) && isset($params["acc_id"])) ? intval($params["acc_id"]) : 0;

        $res = [];
        foreach ($trTypes as $type_id => $trTypeName) {
            $urlParams = $params;
            $urlParams["type"] = strtolower($trTypeName);
            if ($type_id != DEBT && $acc_id == 0) {
                unset($urlParams["acc_id"]);
            }

            $item = [
                "value" => $type_id,
                "title" => $trTypeName,
                "selected" => ($type_id == $selectedType),
                "url" => urlJoin($baseUrl, $urlParams)
            ];

            $res[] = $item;
        }

        return $res;
    }

    /**
     * Returns properties for accounts and person containers
     *
     * @param array $data
     *
     * @return array
     */
    protected function getContainersData(array $data)
    {
        $trAvailable = $data["trAvailable"];
        $tr = $data["tr"];
        $debtType = $data["debtType"];
        $noAccount = $data["noAccount"];
        $acc_count = $data["acc_count"];
        if (!is_array($tr) || !isset($tr["type"])) {
            throw new \Error("Invalid parameters");
        }

        $personContainer = [
            "id" => "personContainer",
            "hidden" => (!$trAvailable || $tr["type"] != DEBT),
            "inputId" => "personIdInp",
            "inputValue" => $data["person_id"],
            "title" => "Person",
            "tile" => $data["personTile"],
            "infoItems" => [],
        ];

        if ($noAccount) {
            $debtAccountLabel = "No account";
        } else {
            $debtAccountLabel = ($debtType) ? __("TR_DEST_ACCOUNT") : __("TR_SRC_ACCOUNT");
        }
        $debtAccountContainer = [
            "id" => "debtAccountContainer",
            "hidden" => (!$trAvailable || $tr["type"] != DEBT),
            "inputId" => "debtAccountInp",
            "inputValue" => $data["acc_id"],
            "title" => $debtAccountLabel,
            "baseHidden" => $noAccount,
            "closeButton" => $noAccount,
            "accountToggler" => (!$noAccount || !$acc_count),
            "noAccountsMsg" => __("TR_DEBT_NO_ACCOUNTS"),
            "noAccountsMsgHidden" => ($acc_count > 0),
            "tile" => $data["debtAccountTile"],
            "infoItems" => [],
        ];

        $debtSrcContainer = ($debtType) ? $personContainer : $debtAccountContainer;
        $debtDestContainer = ($debtType) ? $debtAccountContainer : $personContainer;

        if ($tr["type"] == DEBT) {
            $debtSrcContainer["infoItems"][] = $data["srcAmountInfo"];
            $debtSrcContainer["infoItems"][] = $data["exchangeInfo"];
            $debtSrcContainer["infoItems"][] = $data["srcResultInfo"];

            $debtDestContainer["infoItems"][] = $data["destAmountInfo"];
            $debtDestContainer["infoItems"][] = $data["destResultInfo"];
        }

        $data["debtSrcContainer"] = $debtSrcContainer;
        $data["debtDestContainer"] = $debtDestContainer;

        $sourceContainer = [
            "id" => "sourceContainer",
            "hidden" => (!$trAvailable || $tr["type"] == INCOME || $tr["type"] == DEBT),
            "inputId" => "srcIdInp",
            "inputValue" => $tr["src_id"],
            "title" => __("TR_SRC_ACCOUNT"),
            "tile" => $data["srcAccountTile"],
            "infoItems" => [],
        ];
        if ($tr["type"] == TRANSFER) {
            $sourceContainer["infoItems"][] = $data["srcAmountInfo"];
        }
        if ($tr["type"] == EXPENSE) {
            $sourceContainer["infoItems"][] = $data["destAmountInfo"];
        }
        if ($tr["type"] != DEBT) {
            $sourceContainer["infoItems"][] = $data["srcResultInfo"];
        }
        if ($tr["type"] == EXPENSE || $tr["type"] == TRANSFER) {
            $sourceContainer["infoItems"][] = $data["exchangeInfo"];
        }
        $data["sourceContainer"] = $sourceContainer;

        $destContainer = [
            "id" => "destContainer",
            "hidden" => (!$trAvailable || $tr["type"] == EXPENSE || $tr["type"] == DEBT),
            "inputId" => "destIdInp",
            "inputValue" => $tr["dest_id"],
            "title" => __("TR_DEST_ACCOUNT"),
            "tile" => $data["destAccountTile"],
            "infoItems" => [],
        ];
        if ($tr["type"] == EXPENSE || $tr["type"] == INCOME) {
            $destContainer["infoItems"][] = $data["srcAmountInfo"];
        }
        if ($tr["type"] == INCOME || $tr["type"] == TRANSFER) {
            $destContainer["infoItems"][] = $data["destAmountInfo"];
        }
        if ($tr["type"] != DEBT) {
            $destContainer["infoItems"][] = $data["destResultInfo"];
        }
        if ($tr["type"] == INCOME) {
            $destContainer["infoItems"][] = $data["exchangeInfo"];
        }
        $data["destContainer"] = $destContainer;

        return $data;
    }

    /**
     * /transactions/create/ route handler
     * Renders create transaction view
     */
    public function create()
    {
        if ($this->isPOST()) {
            $this->fail(__("ERR_INVALID_REQUEST"));
        }

        $this->template = new Template(VIEW_TPL_PATH . "Transaction.tpl");
        $data = [
            "action" => "create",
        ];
        $form = [];

        $userAccounts = $this->accModel->getUserAccounts();
        $acc_count = count($userAccounts);
        $data["acc_count"] = $acc_count;

        $persons = $this->personMod->getData(["visibility" => "all", "sort" => "visibility"]);
        $iconModel = IconModel::getInstance();
        $defMsg = __("ERR_TRANS_CREATE");

        $targetDate = getdate();
        $targetTime = mktime(0, 0, 0, $targetDate["mon"], $targetDate["mday"], $targetDate["year"]);

        $tr = [
            "type" => $this->getRequestedType($_GET, EXPENSE),
            "src_amount" => 0,
            "dest_amount" => 0,
            "date" => $targetTime,
            "category_id" => 0,
            "comment" => ""
        ];

        // Check availability of selected type of transaction
        $notAvailMessage = null;
        $trAvailable = false;
        if ($tr["type"] == EXPENSE || $tr["type"] == INCOME) {
            $trAvailable = $acc_count > 0;
            $notAvailMessage = __("TR_NO_ACCOUNTS");
        } elseif ($tr["type"] == TRANSFER) {
            $trAvailable = $acc_count > 1;
            $notAvailMessage = __("TR_TRANSFER_NO_ACCOUNTS");
        } elseif ($tr["type"] == DEBT) {
            $trAvailable = is_array($persons) && count($persons) > 0;
            $notAvailMessage = __("TR_DEBT_NO_PERSONS");
        }
        $data["trAvailable"] = $trAvailable;
        $data["notAvailMessage"] = $notAvailMessage;

        // Check specified account
        $accountRequested = isset($_GET["acc_id"]);
        $acc_id = ($accountRequested) ? intval($_GET["acc_id"]) : 0;
        // Redirect if invalid account is specified
        if ($acc_id) {
            $account = $this->accModel->getItem($acc_id);
            if (!$account || $account->owner_id != $this->owner_id) {
                $this->fail($defMsg);
            }
        }
        // Use first account if nothing is specified
        if (!$acc_id && $acc_count > 0 && !$accountRequested) {
            $acc_id = $userAccounts[0]->id;
        }

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
        $noAccount = ($acc_id == 0);
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
            "id" => "personTile",
            "title" => ($pObj) ? $pObj->name : null,
            "subtitle" => $this->currModel->format($person_balance, $person_curr)
        ];

        if ($tr["type"] == DEBT && $debtAcc) {
            $data["debtAccountTile"] = $this->getAccountTileData($debtAcc, "debtAccountTile");
        } else {
            $data["debtAccountTile"] = $this->getHiddenAccountTileData("debtAccountTile");
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
            $data["srcAccountTile"] = $this->getAccountTileData($src, "sourceTile");
        } else {
            $data["srcAccountTile"] = $this->getHiddenAccountTileData("sourceTile");
        }

        $dest = $this->accModel->getItem($tr["dest_id"]);
        if ($dest) {
            $data["destAccountTile"] = $this->getAccountTileData($dest, "destTile");
        } else {
            $data["destAccountTile"] = $this->getHiddenAccountTileData("destTile");
        }

        $data["src"] = $src;
        $data["dest"] = $dest;

        // Prepare transaction types menu
        $menuParams = ["acc_id" => $acc_id];
        $baseUrl = BASEURL . "transactions/create/";
        $data["typeMenu"] = $this->getTypeMenu($baseUrl, $tr["type"], $menuParams);

        $form["action"] = BASEURL . "transactions/" . $data["action"] . "/";

        $srcBalTitle = __("TR_RESULT");
        if ($tr["type"] == TRANSFER) {
            $srcBalTitle .= " (" . __("TR_SOURCE") . ")";
        } elseif ($tr["type"] == DEBT) {
            $srcBalTitle .= ($debtType) ? " (" . __("TR_PERSON") . ")" : " (" . __("TR_ACCOUNT") . ")";
        }
        $data["srcBalTitle"] = $srcBalTitle;

        $balDiff = $tr["src_amount"];
        if ($tr["type"] != DEBT && !is_null($src)) {
            $src->balfmt = $this->currModel->format($src->balance + $balDiff, $src->curr_id);
            $src->icon = $this->accModel->getIconFile($src->id);
        }

        $destBalTitle = __("TR_RESULT");
        if ($tr["type"] == TRANSFER) {
            $destBalTitle .= " (" . __("TR_DESTINATION") . ")";
        } elseif ($tr["type"] == DEBT) {
            $destBalTitle .= ($debtType) ? " (" . __("TR_ACCOUNT") . ")" : " (" . __("TR_PERSON") . ")";
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
        $showSrcAmount = false;
        $showDestAmount = false;
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
        $data["srcAmountLbl"] = ($showBothAmounts) ? __("TR_SRC_AMOUNT") : __("TR_AMOUNT");
        $data["destAmountLbl"] = ($showBothAmounts) ? __("TR_DEST_AMOUNT") : __("TR_AMOUNT");

        $currObj = $this->currModel->getItem($tr["src_curr"]);
        $srcAmountSign = $currObj ? $currObj->sign : null;
        $form["srcCurrSign"] = $srcAmountSign;

        $currObj = $this->currModel->getItem($tr["dest_curr"]);
        $destAmountSign = $currObj ? $currObj->sign : null;
        $form["destCurrSign"] = $destAmountSign;

        $form["exchSign"] = $destAmountSign . "/" . $srcAmountSign;
        $form["exchange"] = 1;
        $rtExchange = $form["exchange"] . " " . $form["exchSign"];

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
            "id" => "srcAmountInfo",
            "title" => $data["srcAmountLbl"],
            "value" => $this->currModel->format($tr["src_amount"], $tr["src_curr"]),
            "hidden" => true
        ];
        $data["destAmountInfo"] = [
            "id" => "destAmountInfo",
            "title" => $data["destAmountLbl"],
            "value" => $this->currModel->format($tr["dest_amount"], $tr["dest_curr"]),
            "hidden" => true
        ];
        $data["srcResultInfo"] = [
            "id" => "srcResBalanceInfo",
            "title" => __("TR_RESULT"),
            "value" => $rtSrcResBal,
            "hidden" => false
        ];
        $data["destResultInfo"] = [
            "id" => "destResBalanceInfo",
            "title" => __("TR_RESULT"),
            "value" => $rtDestResBal,
            "hidden" => false
        ];
        $data["exchangeInfo"] = [
            "id" => "exchangeInfo",
            "title" => __("TR_EXCHANGE_RATE"),
            "value" => $rtExchange,
            "hidden" => !$isDiffCurr
        ];

        $data = $this->getContainersData($data);

        $data["dateFmt"] = date("d.m.Y");

        $data["headString"] = __("TR_CREATE");
        $data["titleString"] = __("APP_NAME") . " | " . $data["headString"];

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->accModel->getData(["owner" => "all", "visibility" => "all"]),
            "currency" => $this->currModel->getData(),
            "icons" => $iconModel->getData(),
            "persons" => $this->personMod->getData(["visibility" => "all"]),
            "categories" => $this->catModel->getData(),
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

    /**
     * /transactions/update/ route handler
     * Renders update transaction view
     */
    public function update()
    {
        if ($this->isPOST()) {
            $this->fail(__("ERR_INVALID_REQUEST"));
        }

        $this->template = new Template(VIEW_TPL_PATH . "Transaction.tpl");
        $data = [
            "action" => "update",
        ];
        $form = [];

        $persons = $this->personMod->getData(["visibility" => "all", "sort" => "visibility"]);
        $iconModel = IconModel::getInstance();
        $defMsg = __("ERR_TRANS_UPDATE");

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

        $userAccounts = $this->accModel->getUserAccounts();
        $data["acc_count"] = count($userAccounts);

        $notAvailMessage = null;
        $data["notAvailMessage"] = $notAvailMessage;
        $trAvailable = true;
        $data["trAvailable"] = $trAvailable;

        // get information about source and destination accounts
        $src = $this->accModel->getItem($tr["src_id"]);
        if ($src) {
            $data["srcAccountTile"] = $this->getAccountTileData($src, "sourceTile", $tr["src_amount"]);
        } else {
            $data["srcAccountTile"] = $this->getHiddenAccountTileData("sourceTile");
        }

        $dest = $this->accModel->getItem($tr["dest_id"]);
        if ($dest) {
            $data["destAccountTile"] = $this->getAccountTileData($dest, "destTile", -$tr["dest_amount"]);
        } else {
            $data["destAccountTile"] = $this->getHiddenAccountTileData("destTile");
        }

        $data["src"] = $src;
        $data["dest"] = $dest;

        // Prepare transaction types menu
        $baseUrl = $baseUrl = BASEURL . "transactions/update/" . $trans_id;
        $data["typeMenu"] = $this->getTypeMenu($baseUrl, $tr["type"]);

        $form["action"] = BASEURL . "transactions/" . $data["action"] . "/";

        $showSrcAmount = false;
        $showDestAmount = false;
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
                throw new \Error(__("ERR_USER_NOT_FOUND"));
            }

            $debtType = (!is_null($src) && $src->owner_id != $uObj->owner_id);

            $person_id = ($debtType) ? $src->owner_id : $dest->owner_id;

            $pObj = $this->personMod->getItem($person_id);
            if (!$pObj) {
                throw new \Error(__("ERR_PERSON_NOT_FOUND"));
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

            $person_id = (is_array($persons) && count($persons) > 0)
                ? $persons[0]->id
                : 0;
            $pObj = $this->personMod->getItem($person_id);

            $person_curr = $tr["src_curr"];
            $person_acc = $this->accModel->getPersonAccount($person_id, $person_curr);
            $person_acc_id = ($person_acc) ? $person_acc->id : 0;
            $person_res_balance = ($person_acc) ? $person_acc->balance : 0.0;
            $person_balance = $person_res_balance;
        }

        $srcBalTitle = __("TR_RESULT");
        if ($tr["type"] == TRANSFER) {
            $srcBalTitle .= " (" . __("TR_SOURCE") . ")";
        } elseif ($tr["type"] == DEBT) {
            $srcBalTitle .= ($debtType) ? " (" . __("TR_PERSON") . ")" : " (" . __("TR_ACCOUNT") . ")";
        }

        $destBalTitle = __("TR_RESULT");
        if ($tr["type"] == TRANSFER) {
            $destBalTitle .= " (" . __("TR_DESTINATION") . ")";
        } elseif ($tr["type"] == DEBT) {
            $destBalTitle .= ($debtType) ? " (" . __("TR_ACCOUNT") . ")" : " (" . __("TR_PERSON") . ")";
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
            "id" => "personTile",
            "title" => ($pObj) ? $pObj->name : null,
            "subtitle" => $this->currModel->format($person_balance, $person_curr),
        ];

        $data["tr"] = $tr;

        $showBothAmounts = $showSrcAmount && $showDestAmount;
        $data["srcAmountLbl"] = ($showBothAmounts) ? __("TR_SRC_AMOUNT") : __("TR_AMOUNT");
        $data["destAmountLbl"] = ($showBothAmounts) ? __("TR_DEST_AMOUNT") : __("TR_AMOUNT");

        if ($tr["type"] == DEBT && $debtAcc) {
            $balanceDiff = 0;
            if (!$noAccount) {
                $balanceDiff = ($debtType) ? -$tr["dest_amount"] : $tr["src_amount"];
            }

            $data["debtAccountTile"] = $this->getAccountTileData($debtAcc, "debtAccountTile", $balanceDiff);
        } else {
            $data["debtAccountTile"] = $this->getHiddenAccountTileData("debtAccountTile");
        }

        $data["acc_id"] = ($debtAcc) ? $debtAcc->id : 0;

        $currObj = $this->currModel->getItem($tr["src_curr"]);
        $form["srcCurrSign"] = $currObj ? $currObj->sign : null;

        $currObj = $this->currModel->getItem($tr["dest_curr"]);
        $form["destCurrSign"] = $currObj ? $currObj->sign : null;

        $form["exchSign"] = $form["destCurrSign"] . "/" . $form["srcCurrSign"];
        $form["exchange"] = normalize($tr["dest_amount"] / $tr["src_amount"], 4);
        $rtExchange = $form["exchange"] . " " . $form["exchSign"];

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
            "id" => "srcAmountInfo",
            "title" => $data["srcAmountLbl"],
            "value" => $this->currModel->format($tr["src_amount"], $tr["src_curr"]),
            "hidden" => true
        ];
        $data["destAmountInfo"] = [
            "id" => "destAmountInfo",
            "title" => $data["destAmountLbl"],
            "value" => $this->currModel->format($tr["dest_amount"], $tr["dest_curr"]),
            "hidden" => true
        ];
        $data["srcResultInfo"] = [
            "id" => "srcResBalanceInfo",
            "title" => __("TR_RESULT"),
            "value" => $rtSrcResBal,
            "hidden" => false
        ];
        $data["destResultInfo"] = [
            "id" => "destResBalanceInfo",
            "title" => __("TR_RESULT"),
            "value" => $rtDestResBal,
            "hidden" => false
        ];
        $data["exchangeInfo"] = [
            "id" => "exchangeInfo",
            "title" => __("TR_EXCHANGE_RATE"),
            "value" => $rtExchange,
            "hidden" => !$isDiffCurr
        ];

        $data = $this->getContainersData($data);

        $data["dateFmt"] = date("d.m.Y", $tr["date"]);

        $data["headString"] = __("TR_UPDATE");
        $data["titleString"] = __("APP_NAME") . " | " . $data["headString"];

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->accModel->getData(["owner" => "all", "visibility" => "all"]),
            "currency" => $this->currModel->getData(),
            "icons" => $iconModel->getData(),
            "persons" => $this->personMod->getData(["visibility" => "all"]),
            "categories" => $this->catModel->getData(),
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
