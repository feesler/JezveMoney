<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Message;
use JezveMoney\Core\Template;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\IconModel;
use JezveMoney\App\Model\TransactionModel;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Shared\Date;

/**
 * Accounts controller
 */
class Accounts extends TemplateController
{
    protected $model = null;
    protected $requiredFields = ["name", "initbalance", "curr_id", "icon_id", "flags"];

    /**
     * Controller initialization
     */
    protected function onStart()
    {
        $this->model = AccountModel::getInstance();
    }

    /**
     * /accounts/ route handler
     * Renders accounts list view
     */
    public function index()
    {
        $this->template = new Template(VIEW_TPL_PATH . "AccountList.tpl");
        $data = [
            "titleString" => __("APP_NAME") . " | " . __("ACCOUNTS"),
            "tilesArr" => [],
            "hiddenTilesArr" => []
        ];

        $currMod = CurrencyModel::getInstance();
        $iconModel = IconModel::getInstance();

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->model->getData(["visibility" => "all"]),
            "currency" => $currMod->getData(),
            "icons" => $iconModel->getData(),
        ];

        $this->cssArr[] = "AccountListView.css";
        $this->jsArr[] = "AccountListView.js";

        $this->render($data);
    }

    /**
     * /accounts/create/ route handler
     * Renders create account view
     */
    public function create()
    {
        if ($this->isPOST()) {
            $this->fail(__("ERR_INVALID_REQUEST"));
        }

        $this->template = new Template(VIEW_TPL_PATH . "Account.tpl");
        $data = [
            "headString" => __("ACCOUNT_CREATE"),
            "titleString" => __("APP_NAME") . " | " . __("ACCOUNT_CREATE"),
        ];

        $currMod = CurrencyModel::getInstance();

        $accInfo = new \stdClass();
        $accInfo->id = 0;
        $accInfo->name = "";
        $accInfo->curr_id = $currMod->getIdByPos(0);
        $accInfo->balance = 0;
        $accInfo->initbalance = "";
        $accInfo->icon_id = 0;
        $accInfo->icon = null;
        $accInfo->flags = 0;

        $currObj = $currMod->getItem($accInfo->curr_id);
        if (!$currObj) {
            throw new \Error(__("ERR_CURR_NOT_FOUND"));
        }

        $accInfo->sign = $currObj->sign;
        $data["accInfo"] = $accInfo;
        $data["tile"] = [
            "id" => "accountTile",
            "title" => __("ACCOUNT_NAME_NEW"),
            "subtitle" => $currMod->format($accInfo->balance, $accInfo->curr_id),
            "icon" => $accInfo->icon,
        ];

        $iconModel = IconModel::getInstance();
        $data["icons"] = $iconModel->getData();

        $data["nextAddress"] = $this->getNextAddress();
        $data["appProps"] = [
            "accounts" => $this->model->getData(["visibility" => "all"]),
            "currency" => $currMod->getData(),
            "icons" => $data["icons"],
            "view" => [
                "account" => $accInfo,
            ],
        ];

        $this->cssArr[] = "AccountView.css";
        $this->jsArr[] = "AccountView.js";

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

        setLocation(BASEURL . "accounts/");
    }

    /**
     * /accounts/update/ route handler
     * Renders update account view
     */
    public function update()
    {
        if ($this->isPOST()) {
            $this->fail(__("ERR_INVALID_REQUEST"));
        }

        $this->template = new Template(VIEW_TPL_PATH . "Account.tpl");
        $data = [
            "headString" => __("ACCOUNT_UPDATE"),
            "titleString" => __("APP_NAME") . " | " . __("ACCOUNT_UPDATE"),
        ];

        $currMod = CurrencyModel::getInstance();

        $acc_id = intval($this->actionParam);
        if (!$acc_id) {
            $this->fail();
        }
        $data["acc_id"] = $acc_id;

        $accInfo = $this->model->getItem($acc_id);
        if (!$accInfo) {
            $this->fail(__("ERR_ACCOUNT_UPDATE"));
        }

        $currObj = $currMod->getItem($accInfo->curr_id);
        $accInfo->sign = ($currObj) ? $currObj->sign : null;
        $accInfo->icon = $this->model->getIconFile($acc_id);
        $data["accInfo"] = $accInfo;

        $data["tile"] = [
            "id" => "accountTile",
            "title" => $accInfo->name,
            "subtitle" => $currMod->format($accInfo->balance, $accInfo->curr_id),
            "icon" => $accInfo->icon
        ];

        $iconModel = IconModel::getInstance();
        $data["icons"] = $iconModel->getData();

        $data["nextAddress"] = $this->getNextAddress();
        $data["appProps"] = [
            "accounts" => $this->model->getData(["visibility" => "all"]),
            "currency" => $currMod->getData(),
            "icons" => $data["icons"],
            "view" => [
                "account" => $accInfo,
            ],
        ];

        $this->cssArr[] = "AccountView.css";
        $this->jsArr[] = "AccountView.js";

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
     * /accounts/export/ route handler
     * Prepares CSV file and sends it to user
     */
    public function export()
    {
        $transMod = TransactionModel::getInstance();
        $currMod = CurrencyModel::getInstance();
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $ids = $this->getRequestedIds();

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
        $transactionsList = $transMod->getData(["accounts" => $ids]);
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
