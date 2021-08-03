<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Message;
use JezveMoney\Core\Template;
use JezveMoney\Core\JSON;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\IconModel;
use JezveMoney\App\Model\TransactionModel;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Shared\Date;

class Accounts extends TemplateController
{
    protected $model = null;
    protected $requiredFields = ["name", "initbalance", "curr_id", "icon_id", "flags"];


    protected function onStart()
    {
        $this->model = AccountModel::getInstance();
    }


    public function index()
    {
        $this->template = new Template(TPL_PATH . "accounts.tpl");
        $data = [
            "titleString" => "Jezve Money | Accounts",
            "tilesArr" => [],
            "hiddenTilesArr" => []
        ];

        $currMod = CurrencyModel::getInstance();

        $accountsData = $this->model->getData(["type" => "all"]);
        foreach ($accountsData as $account) {
            $hidden = $this->model->isHidden($account);
            $var = $hidden ? "hiddenTilesArr" : "tilesArr";
            $data[$var][] = [
                "type" => "button",
                "attributes" => ["data-id" => $account->id],
                "title" => $account->name,
                "subtitle" => $currMod->format($account->balance, $account->curr_id),
                "icon" => $this->model->getIconFile($account->id)
            ];
        }

        $data["viewData"] = JSON::encode([
            "accounts" => $accountsData
        ]);

        $this->cssArr[] = "AccountListView.css";
        $this->jsArr[] = "AccountListView.js";

        $this->render($data);
    }


    public function create()
    {
        if ($this->isPOST()) {
            $this->createAccount();
            return;
        }

        $this->template = new Template(TPL_PATH . "account.tpl");
        $data = [
            "headString" => "New account",
            "titleString" => "Jezve Money | New account"
        ];

        $currMod = CurrencyModel::getInstance();

        $accInfo = new \stdClass();
        $accInfo->id = 0;
        $accInfo->name = "";
        $accInfo->curr_id = $currMod->getIdByPos(0);
        $accInfo->balance = 0;
        $accInfo->initbalance = 0;
        $accInfo->icon_id = 0;
        $accInfo->icon = null;
        $accInfo->flags = 0;

        $currObj = $currMod->getItem($accInfo->curr_id);
        if (!$currObj) {
            throw new \Error("Currency not found");
        }

        $accInfo->sign = $currObj->sign;
        $data["accInfo"] = $accInfo;
        $data["tile"] = [
            "type" => "button",
            "attributes" => ["id" => "acc_tile"],
            "title" => "New account",
            "subtitle" => $currMod->format($accInfo->balance, $accInfo->curr_id),
            "icon" => $accInfo->icon
        ];

        $data["currArr"] = $currMod->getData();

        $iconModel = IconModel::getInstance();
        $data["icons"] = $iconModel->getData();

        $data["viewData"] = JSON::encode([
            "account" => $accInfo,
            "currency" => $data["currArr"],
            "icons" => $data["icons"]
        ]);

        $this->cssArr[] = "AccountView.css";
        $this->jsArr[] = "AccountView.js";

        $this->render($data);
    }


    private function fail($msg = null)
    {
        if (!is_null($msg)) {
            Message::set($msg);
        }

        setLocation(BASEURL . "accounts/");
    }


    public function update()
    {
        if ($this->isPOST()) {
            $this->updateAccount();
            return;
        }

        $this->template = new Template(TPL_PATH . "account.tpl");
        $data = [
            "headString" => "Edit account",
            "titleString" => "Jezve Money | Edit account"
        ];

        $currMod = CurrencyModel::getInstance();

        $acc_id = intval($this->actionParam);
        if (!$acc_id) {
            $this->fail();
        }
        $data["acc_id"] = $acc_id;

        $accInfo = $this->model->getItem($acc_id);

        $currObj = $currMod->getItem($accInfo->curr_id);
        $accInfo->sign = ($currObj) ? $currObj->sign : null;
        $accInfo->icon = $this->model->getIconFile($acc_id);
        $data["accInfo"] = $accInfo;

        $data["tile"] = [
            "type" => "button",
            "attributes" => ["id" => "acc_tile"],
            "title" => $accInfo->name,
            "subtitle" => $currMod->format($accInfo->balance, $accInfo->curr_id),
            "icon" => $accInfo->icon
        ];

        $data["currArr"] = $currMod->getData();

        $iconModel = IconModel::getInstance();
        $data["icons"] = $iconModel->getData();

        $data["viewData"] = JSON::encode([
            "account" => $accInfo,
            "currency" => $data["currArr"],
            "icons" => $data["icons"]
        ]);

        $this->cssArr[] = "AccountView.css";
        $this->jsArr[] = "AccountView.js";

        $this->render($data);
    }


    protected function createAccount()
    {
        if (!$this->isPOST()) {
            setLocation(BASEURL . "accounts/");
        }

        $defMsg = ERR_ACCOUNT_CREATE;

        $reqData = checkFields($_POST, $this->requiredFields);
        if ($reqData === false) {
            $this->fail($defMsg);
        }

        $uObj = $this->uMod->getItem($this->user_id);
        if (!$uObj) {
            $this->fail($defMsg);
        }

        $reqData["owner_id"] = $uObj->owner_id;

        if (!$this->model->create($reqData)) {
            $this->fail($defMsg);
        }

        Message::set(MSG_ACCOUNT_CREATE);

        setLocation(BASEURL . "accounts/");
    }


    protected function updateAccount()
    {
        if (!$this->isPOST()) {
            setLocation(BASEURL . "accounts/");
        }

        $defMsg = ERR_ACCOUNT_UPDATE;

        if (!isset($_POST["id"])) {
            $this->fail($defMsg);
        }

        $reqData = checkFields($_POST, $this->requiredFields);
        if (!$this->model->update($_POST["id"], $reqData)) {
            $this->fail($defMsg);
        }

        Message::set(MSG_ACCOUNT_UPDATE);

        setLocation(BASEURL . "accounts/");
    }


    public function show()
    {
        if (!$this->isPOST()) {
            setLocation(BASEURL . "accounts/");
        }

        $defMsg = ERR_ACCOUNT_SHOW;

        if (!isset($_POST["accounts"])) {
            $this->fail($defMsg);
        }

        $ids = explode(",", rawurldecode($_POST["accounts"]));
        if (!$this->model->show($ids)) {
            $this->fail($defMsg);
        }

        setLocation(BASEURL . "accounts/");
    }


    public function hide()
    {
        if (!$this->isPOST()) {
            setLocation(BASEURL . "accounts/");
        }

        $defMsg = ERR_ACCOUNT_HIDE;

        if (!isset($_POST["accounts"])) {
            $this->fail($defMsg);
        }

        $ids = explode(",", rawurldecode($_POST["accounts"]));
        if (!$this->model->hide($ids)) {
            $this->fail($defMsg);
        }

        setLocation(BASEURL . "accounts/");
    }


    public function del()
    {
        if (!$this->isPOST()) {
            setLocation(BASEURL . "accounts/");
        }

        $defMsg = ERR_ACCOUNT_DELETE;

        if (!isset($_POST["accounts"])) {
            $this->fail($defMsg);
        }

        $ids = explode(",", rawurldecode($_POST["accounts"]));
        if (!$this->model->del($ids)) {
            $this->fail($defMsg);
        }

        Message::set(MSG_ACCOUNT_DELETE);

        setLocation(BASEURL . "accounts/");
    }


    // Short alias for Coordinate::stringFromColumnIndex() method
    private static function columnStr($ind)
    {
        return Coordinate::stringFromColumnIndex($ind);
    }


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
            "type" => "Type",
            "src_amount" => "Source amount",
            "dest_amount" => "Destination amount",
            "src_result" => "Source result",
            "dest_result" => "Destination result",
            "date" => "Date",
            "comment" => "Comment"
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
