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
use JezveMoney\App\Model\UserCurrencyModel;
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
    protected $userCurrModel = null;
    protected $catModel = null;

    /**
     * Controller initialization
     */
    protected function onStart()
    {
        $this->model = TransactionModel::getInstance();
        $this->accModel = AccountModel::getInstance();
        $this->currModel = CurrencyModel::getInstance();
        $this->userCurrModel = UserCurrencyModel::getInstance();
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

        $this->initResources("TransactionListView");
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
            "headString" => __("TR_CREATE"),
            "titleString" => __("APP_NAME") . " | " . __("TR_CREATE"),
        ];

        $userAccounts = $this->accModel->getUserAccounts();
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
        $trAvailable = false;
        $creditCardAccounts = null;
        if ($tr["type"] == EXPENSE || $tr["type"] == INCOME) {
            $trAvailable = count($userAccounts) > 0;
        } elseif ($tr["type"] == TRANSFER) {
            $trAvailable = count($userAccounts) > 1;
        } elseif ($tr["type"] == DEBT) {
            $trAvailable = is_array($persons) && count($persons) > 0;
        } elseif ($tr["type"] == LIMIT_CHANGE) {
            $creditCardAccounts = $this->accModel->getUserAccounts([
                "type" => ACCOUNT_TYPE_CREDIT_CARD,
            ]);
            $trAvailable = count($creditCardAccounts) > 0;
        }

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
        if (!$acc_id && !$accountRequested) {
            if ($tr["type"] == LIMIT_CHANGE) {
                if (is_array($creditCardAccounts) && count($creditCardAccounts) > 0) {
                    $acc_id = $creditCardAccounts[0]->id;
                }
            } elseif (count($userAccounts) > 0) {
                $acc_id = $userAccounts[0]->id;
            }
        }

        // Check person parameter
        $person_id = 0;
        if (isset($_GET["person_id"]) && $tr["type"] == DEBT) {
            $person_id = intval($_GET["person_id"]);
        }
        if (!$person_id && count($persons) > 0) {
            $person_id = $persons[0]->id;
        }
        if ($person_id) {
            $person = $this->personMod->getItem($person_id);
            if (!$person) {
                $this->fail(__("ERR_PERSON_NOT_FOUND"));
            }
        }

        $debtType = true;
        $noAccount = ($acc_id == 0);
        $debtAcc = $this->accModel->getItem($acc_id);

        // Prepare person account
        $person_curr = ($debtAcc) ? $debtAcc->curr_id : $this->currModel->getIdByPos(0);
        $person_acc = $this->accModel->getPersonAccount($person_id, $person_curr);
        $person_acc_id = ($person_acc) ? $person_acc->id : 0;

        if ($tr["type"] == DEBT) {
            $tr["src_id"] = $person_acc_id;
            $tr["dest_id"] = $acc_id;
            $tr["src_curr"] = ($debtAcc) ? $debtAcc->curr_id : $person_curr;
            $tr["dest_curr"] = ($debtAcc) ? $debtAcc->curr_id : $person_curr;
            $tr["person_id"] = $person_id;
            $tr["debtType"] = $debtType;
            $tr["lastAcc_id"] = $acc_id;
            $tr["noAccount"] = $noAccount;
        } else {
            // set source and destination accounts
            $src_id = 0;
            $dest_id = 0;
            if ($tr["type"] == EXPENSE || $tr["type"] == TRANSFER) {
                $src_id = ($acc_id ? $acc_id : $this->accModel->getAnother());
            } elseif ($tr["type"] == INCOME) {       // income
                $dest_id = ($acc_id ? $acc_id : $this->accModel->getAnother());
            } elseif ($tr["type"] == LIMIT_CHANGE) {
                $dest_id = $acc_id;
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
            } elseif ($tr["type"] == INCOME || $tr["type"] == LIMIT_CHANGE) {
                $tr["src_curr"] = $tr["dest_curr"];
            }

            if ($tr["type"] == TRANSFER && !$trAvailable) {
                $tr["dest_curr"] = $tr["src_curr"];
            }
        }

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->accModel->getData(["owner" => "all", "visibility" => "all"]),
            "currency" => $this->currModel->getData(),
            "userCurrencies" => $this->userCurrModel->getData(),
            "icons" => $iconModel->getData(),
            "persons" => $this->personMod->getData(["visibility" => "all"]),
            "categories" => $this->catModel->getData(),
            "nextAddress" => $this->getNextAddress(),
            "view" => [
                "mode" => $this->action,
                "transaction" => $tr,
                "trAvailable" => $trAvailable,
            ],
        ];

        $this->initResources("TransactionView");
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
            "headString" => __("TR_UPDATE"),
            "titleString" => __("APP_NAME") . " | " . __("TR_UPDATE"),
        ];

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

        // check type change request
        $requestedType = $this->getRequestedType($_GET, $tr["type"]);

        if ($tr["type"] == DEBT) {
            $src = $this->accModel->getItem($tr["src_id"]);
            $dest = $this->accModel->getItem($tr["dest_id"]);

            $debtType = (!is_null($src) && $src->owner_id !== $this->owner_id);

            $person_id = ($debtType) ? $src->owner_id : $dest->owner_id;
            $person = $this->personMod->getItem($person_id);
            if (!$person) {
                throw new \Error(__("ERR_PERSON_NOT_FOUND"));
            }

            $debtAcc = $debtType ? $dest : $src;
            $noAccount = is_null($debtAcc);

            $acc_id = ($noAccount)
                ? $this->accModel->getAnother()
                : $debtAcc->id;

            $tr["person_id"] = $person_id;
            $tr["debtType"] = $debtType;
            $tr["lastAcc_id"] = $acc_id;
            $tr["noAccount"] = $noAccount;
        }

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->accModel->getData(["owner" => "all", "visibility" => "all"]),
            "currency" => $this->currModel->getData(),
            "userCurrencies" => $this->userCurrModel->getData(),
            "icons" => $iconModel->getData(),
            "persons" => $this->personMod->getData(["visibility" => "all"]),
            "categories" => $this->catModel->getData(),
            "nextAddress" => $this->getNextAddress(),
            "view" => [
                "mode" => $this->action,
                "transaction" => $tr,
                "trAvailable" => true,
                "requestedType" => $requestedType,
            ],
        ];

        $this->initResources("TransactionView");
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
