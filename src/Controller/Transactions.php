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
use JezveMoney\App\Model\ReminderModel;
use JezveMoney\App\Model\UserCurrencyModel;
use JezveMoney\App\Model\UserSettingsModel;
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
        $data = [
            "titleString" => __("appName") . " | " . __("transactions.listTitle"),
        ];

        $requestDefaults = [
            "page" => 1,
            "range" => 1,
            "onPage" => 10,
        ];

        $request = $this->model->getRequestFilters($_GET, $requestDefaults);

        // Obtain requested view mode
        $showDetails = false;
        if (isset($_GET["mode"]) && $_GET["mode"] == "details") {
            $showDetails = true;
        }

        $params = $request["params"];
        $params["desc"] = true;

        $transactions = $this->model->getData($params);

        $detailsId = $this->getRequestedItem();

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->accModel->getData(["owner" => "all", "visibility" => "all"]),
            "persons" => $this->personMod->getData(["visibility" => "all"]),
            "currency" => $this->currModel->getData(),
            "categories" => $this->catModel->getData(),
            "view" => [
                "items" => $transactions,
                "filter" => $request["filter"],
                "pagination" => $request["pagination"],
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
            $this->fail(__("transactions.errors.invalidType"));
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
            $this->fail(__("errors.invalidRequest"));
        }

        $this->template = new Template(VIEW_TPL_PATH . "Transaction.tpl");
        $data = [
            "action" => "create",
            "headString" => __("transactions.create"),
            "titleString" => __("appName") . " | " . __("transactions.create"),
        ];

        $userAccounts = $this->accModel->getUserAccounts();
        $persons = $this->personMod->getData(["visibility" => "all", "sort" => "visibility"]);
        $iconModel = IconModel::getInstance();
        $defMsg = __("transactions.errors.create");

        $fromReminder = isset($_GET["reminder_id"]);

        if ($fromReminder) {
            $reminderModel = ReminderModel::getInstance();
            $tr = $reminderModel->getDefaultTransaction($_GET["reminder_id"]);
            $tr["reminder_id"] = intval($_GET["reminder_id"]);
        } else {
            $tr = [
                "type" => EXPENSE,
                "src_amount" => 0,
                "dest_amount" => 0,
                "date" => cutDate(UserSettingsModel::clientTime()),
                "category_id" => 0,
                "comment" => "",
            ];
        }

        $tr["type"] = $this->getRequestedType($_GET, ($tr["type"] ?? EXPENSE));

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
        $accountRequested = isset($_GET["acc_id"]) && !$fromReminder;
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
        $personRequested = isset($_GET["person_id"]) && $tr["type"] == DEBT && !$fromReminder;
        $person_id = 0;
        if ($personRequested) {
            $person_id = intval($_GET["person_id"]);
        }
        if (!$person_id && count($persons) > 0) {
            $person_id = $persons[0]->id;
        }
        if ($person_id) {
            $person = $this->personMod->getItem($person_id);
            if (!$person) {
                $this->fail(__("persons.errors.notFound"));
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
            $tr["acc_id"] = $acc_id;
            $tr["lastAcc_id"] = $acc_id;
            $tr["noAccount"] = $noAccount;
        } elseif (!$fromReminder) {
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
            $this->fail(__("errors.invalidRequest"));
        }

        $this->template = new Template(VIEW_TPL_PATH . "Transaction.tpl");
        $data = [
            "action" => "update",
            "headString" => __("transactions.update"),
            "titleString" => __("appName") . " | " . __("transactions.update"),
        ];

        $iconModel = IconModel::getInstance();
        $defMsg = __("transactions.errors.update");

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
                throw new \Error(__("persons.errors.notFound"));
            }

            $debtAcc = $debtType ? $dest : $src;
            $noAccount = is_null($debtAcc);

            $acc_id = ($noAccount)
                ? $this->accModel->getAnother()
                : $debtAcc->id;

            $tr["person_id"] = $person_id;
            $tr["debtType"] = $debtType;
            $tr["acc_id"] = $acc_id;
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

        $requestDefaults = [
            "onPage" => 0,
            "page" => 1,
            "range" => 1,
        ];

        $request = $this->model->getRequestFilters($_GET, $requestDefaults, true);

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
            "type" => __("transactions.type"),
            "src_amount" => __("transactions.sourceAmount"),
            "dest_amount" => __("transactions.destAmount"),
            "src_result" => __("transactions.sourceResult"),
            "dest_result" => __("transactions.destResult"),
            "date" => __("transactions.date"),
            "comment" => __("transactions.comment"),
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
        $transactionsList = $this->model->getData($request["params"]);
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
