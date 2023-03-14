<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\ListViewController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\IconModel;
use JezveMoney\App\Model\TransactionModel;
use JezveMoney\App\Model\CategoryModel;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Shared\Date;

/**
 * Transactions controller
 */
class Transactions extends ListViewController
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

        // Obtain requested view mode
        $showDetails = false;
        if (isset($_GET["mode"]) && $_GET["mode"] == "details") {
            $showDetails = true;
        }
        $data["showDetails"] = $showDetails;

        $transactions = $this->model->getData($trParams);

        $transCount = $this->model->getTransCount($trParams);
        $pagination["total"] = $transCount;

        // Build data for paginator
        if ($trParams["onPage"] > 0) {
            $pageCount = ceil($transCount / $trParams["onPage"]);
            $pagination["pagesCount"] = $pageCount;
            $page_num = isset($trParams["page"]) ? intval($trParams["page"]) : 0;
            $pagination["page"] = $page_num + 1;
        }

        $detailsId = $this->getRequestedItem();

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->accModel->getData(["owner" => "all", "visibility" => "all"]),
            "persons" => $this->personMod->getData(["visibility" => "all"]),
            "currency" => $this->currModel->getData(),
            "categories" => $this->catModel->getData(),
            "view" => [
                "items" => $transactions,
                "filter" => (object)$filterObj,
                "pagination" => $pagination,
                "mode" => $showDetails ? "details" : "classic",
                "detailsId" => $detailsId,
                "detailsItem" => $this->model->getItem($detailsId),
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

        $tr = [
            "type" => $this->getRequestedType($_GET, EXPENSE),
            "src_amount" => 0,
            "dest_amount" => 0,
            "date" => time(),
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

        $data["person_id"] = $person_id;
        $data["debtType"] = $debtType;
        $data["noAccount"] = $noAccount;

        $data["acc_id"] = ($debtAcc) ? $debtAcc->id : 0;

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
        $dest = $this->accModel->getItem($tr["dest_id"]);
        $data["src"] = $src;
        $data["dest"] = $dest;

        $form["action"] = BASEURL . "transactions/" . $data["action"] . "/";

        $srcBalTitle = __("TR_RESULT");
        if ($tr["type"] == TRANSFER) {
            $srcBalTitle .= " (" . __("TR_SOURCE") . ")";
        } elseif ($tr["type"] == DEBT) {
            $srcBalTitle .= ($debtType) ? " (" . __("TR_PERSON") . ")" : " (" . __("TR_ACCOUNT") . ")";
        }
        $data["srcBalTitle"] = $srcBalTitle;

        $destBalTitle = __("TR_RESULT");
        if ($tr["type"] == TRANSFER) {
            $destBalTitle .= " (" . __("TR_DESTINATION") . ")";
        } elseif ($tr["type"] == DEBT) {
            $destBalTitle .= ($debtType) ? " (" . __("TR_ACCOUNT") . ")" : " (" . __("TR_PERSON") . ")";
        }
        $data["destBalTitle"] = $destBalTitle;

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

        if ($tr["type"] != DEBT) {
            $srcResBalance = ($src) ? $src->balance : 0;
            $destResBalance = ($dest) ? $dest->balance : 0;
        } else {
            $acc_res_balance = ($debtAcc) ? $debtAcc->balance : 0;

            $srcResBalance = ($debtType) ? $person_res_balance : $acc_res_balance;
            $destResBalance = ($debtType) ? $acc_res_balance : $person_res_balance;
        }
        $form["srcResult"] = $srcResBalance;
        $form["destResult"] = $destResBalance;

        $data["form"] = $form;

        $data["dateFmt"] = date("d.m.Y");

        $data["headString"] = __("TR_CREATE");
        $data["titleString"] = __("APP_NAME") . " | " . $data["headString"];

        $data["nextAddress"] = $this->getNextAddress();
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
        $dest = $this->accModel->getItem($tr["dest_id"]);
        $data["src"] = $src;
        $data["dest"] = $dest;

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

        $data["tr"] = $tr;

        $showBothAmounts = $showSrcAmount && $showDestAmount;
        $data["srcAmountLbl"] = ($showBothAmounts) ? __("TR_SRC_AMOUNT") : __("TR_AMOUNT");
        $data["destAmountLbl"] = ($showBothAmounts) ? __("TR_DEST_AMOUNT") : __("TR_AMOUNT");

        $data["acc_id"] = ($debtAcc) ? $debtAcc->id : 0;

        $currObj = $this->currModel->getItem($tr["src_curr"]);
        $form["srcCurrSign"] = $currObj ? $currObj->sign : null;

        $currObj = $this->currModel->getItem($tr["dest_curr"]);
        $form["destCurrSign"] = $currObj ? $currObj->sign : null;

        $form["exchSign"] = $form["destCurrSign"] . "/" . $form["srcCurrSign"];
        $form["exchange"] = normalize($tr["dest_amount"] / $tr["src_amount"], 4);

        if ($tr["type"] != DEBT) {
            $srcResBalance = ($src) ? $src->balance : 0;
            $destResBalance = ($dest) ? $dest->balance : 0;
        } else {
            $acc_res_balance = ($debtAcc) ? $debtAcc->balance : 0;
            if ($noAccount) {
                $acc_res_balance += ($debtType) ? $tr["dest_amount"] : -$tr["src_amount"];
            }
            $srcResBalance = ($debtType) ? $person_res_balance : $acc_res_balance;
            $destResBalance = ($debtType) ? $acc_res_balance : $person_res_balance;
        }
        $form["srcResult"] = $srcResBalance;
        $form["destResult"] = $destResBalance;

        $data["form"] = $form;

        $data["dateFmt"] = date("d.m.Y", $tr["date"]);

        $data["headString"] = __("TR_UPDATE");
        $data["titleString"] = __("APP_NAME") . " | " . $data["headString"];

        $data["nextAddress"] = $this->getNextAddress();
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


    /**
     * Short alias for Coordinate::stringFromColumnIndex() method
     *
     * @param int $ind column index
     *
     * @return string
     */
    private static function columnStr(int $ind)
    {
        return Coordinate::stringFromColumnIndex($ind);
    }

    /**
     * /transactions/export/ route handler
     * Prepares CSV file and sends it to user
     */
    public function export()
    {
        $currMod = CurrencyModel::getInstance();
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $trParams = $this->model->getRequestFilters($_GET);

        $writerType = "Csv";
        $exportFileName = "Exported_" . date("d.m.Y") . "." . strtolower($writerType);

        $writer = IOFactory::createWriter($spreadsheet, $writerType);
        if ($writer instanceof \PhpOffice\PhpSpreadsheet\Writer\Csv) {
            $writer->setDelimiter(';');
            $writer->setEnclosure('"');
            $writer->setLineEnding("\r\n");
            $writer->setSheetIndex(0);
        }

        $columns = [
            "id" => "ID",
            "type" => __("TR_TYPE"),
            "src_amount" => __("TR_SRC_AMOUNT"),
            "dest_amount" => __("TR_DEST_AMOUNT"),
            "src_result" => __("TR_SRC_RESULT"),
            "dest_result" => __("TR_DEST_RESULT"),
            "date" => __("TR_DATE"),
            "comment" => __("TR_COMMENT"),
        ];

        $colStr = [];
        $row_ind = 1;
        $ind = 1;
        // Write header
        foreach ($columns as $col_id => $title) {
            $colStr[$col_id] = self::columnStr($ind++);
            $sheet->setCellValue($colStr[$col_id] . $row_ind, $title);
        }

        // Request transactions data and write to sheet
        $transactionsList = $this->model->getData($trParams);
        foreach ($transactionsList as $transaction) {
            $row_ind++;

            $sheet->setCellValue(
                $colStr["id"] . $row_ind,
                $transaction->id
            );

            $sheet->setCellValue(
                $colStr["type"] . $row_ind,
                TransactionModel::typeToString($transaction->type)
            );

            $sheet->setCellValue(
                $colStr["src_amount"] . $row_ind,
                $currMod->format($transaction->src_amount, $transaction->src_curr)
            );

            $sheet->setCellValue(
                $colStr["dest_amount"] . $row_ind,
                $currMod->format($transaction->dest_amount, $transaction->dest_curr)
            );

            $sheet->setCellValue(
                $colStr["src_result"] . $row_ind,
                $currMod->format($transaction->src_result, $transaction->src_curr)
            );

            $sheet->setCellValue(
                $colStr["dest_result"] . $row_ind,
                $currMod->format($transaction->dest_result, $transaction->dest_curr)
            );

            if ($writerType == "Csv") {
                $dateFmt = date("d.m.Y", $transaction->date);
            } else {
                $dateFmt = Date::PHPToExcel($transaction->date);
            }
            $sheet->setCellValue($colStr["date"] . $row_ind, $dateFmt);

            $sheet->setCellValue($colStr["comment"] . $row_ind, $transaction->comment);
        }

        $spreadsheet->setActiveSheetIndex(0);

        // Redirect output to a client’s web browser (Xlsx)
        if ($writerType == "Csv") {
            header('Content-Type: test/csv');
        }
        header("Content-Disposition: attachment;filename=\"$exportFileName\"");
        header("Cache-Control: max-age=0");
        // If serving to IE 9, then the following may be needed
        header("Cache-Control: max-age=1");
        // If serving to IE over SSL, then the following may be needed
        header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");                    // Date in the past
        header("Last-Modified: " . gmdate('D, d M Y H:i:s') . " GMT");            // always modified
        header("Cache-Control: cache, must-revalidate");        // HTTP/1.1
        header("Pragma: public");                                // HTTP/1.0

        $writer->save('php://output');
        exit;
    }
}
