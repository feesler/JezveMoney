<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\JSON;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\ImportRuleModel;
use JezveMoney\App\Model\ImportActionModel;
use JezveMoney\App\Model\ImportTemplateModel;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Shared\Date;

class FastCommit extends TemplateController
{
    protected $columns = [
        "date" => null,
        "desc" => null,
        "trCurr" => null,
        "trAmount" => null,
        "accCurr" => null,
        "accAmount" => null,
    ];

    protected function onStart()
    {
        $this->templateModel = ImportTemplateModel::getInstance();
        $this->ruleModel = ImportRuleModel::getInstance();
        $this->actionModel = ImportActionModel::getInstance();
    }


    public function index()
    {
        $accMod = AccountModel::getInstance();
        $accArr = $accMod->getData();
        $currMod = CurrencyModel::getInstance();
        $currArr = $currMod->getData();
        $persArr = $this->personMod->getData();
        $impTemplates = $this->templateModel->getData();

        $rules = $this->ruleModel->getData();
        $rulesData = [];
        foreach ($rules as $rule) {
            $rule->actions = $this->actionModel->getData(["rule" => $rule->id]);
            $rulesData[] = $rule;
        }

        $this->css->page = "fastcommit.css";
        $this->buildCSS();

        array_push(
            $this->jsArr,
            "model/list.js",
            "model/account.js",
            "model/currency.js",
            "model/person.js",
            "model/importaction.js",
            "model/importrule.js",
            "lib/ajax.js",
            "lib/dragndrop.js",
            "lib/sortable.js",
            "lib/component.js",
            "component/header.js",
            "component/importtransactionitem.js",
            "view.js",
            "importview.js"
        );

        $titleString = "Jezve Money | Fast Commit";

        include(TPL_PATH . "fastcommit.tpl");
    }


    // Short alias for Coordinate::stringFromColumnIndex() method
    private static function columnStr($ind)
    {
        return Coordinate::stringFromColumnIndex($ind);
    }


    // Set index of specified column
    private function setColumnInd($colName, $ind)
    {
        if (is_empty($colName)) {
            throw new \Error("Invalid column name: " . $colName);
        }

        $this->columns[$colName] = self::columnStr(intval($ind));
    }

    // Appli import template
    private function applyTemplate($template)
    {
        if (is_null($template)) {
            throw new \Error("Invalid template");
        }

        $this->setColumnInd("date", $template->dateColumn);
        $this->setColumnInd("desc", $template->commentColumn);
        $this->setColumnInd("trCurr", $template->transactionCurrColumn);
        $this->setColumnInd("trAmount", $template->transactionAmountColumn);
        $this->setColumnInd("accCurr", $template->accountCurrColumn);
        $this->setColumnInd("accAmount", $template->accountAmountColumn);
    }


    // Return value from cell at specified column and row
    private function getCellValue($sheet, $colName, $row)
    {
        if (!$sheet) {
            throw new \Error("Invalid sheet");
        }
        if (!isset($this->columns[$colName])) {
            throw new \Error("Invalid column " . $colName);
        }

        return $sheet->getCell($this->columns[$colName] . intval($row))->getValue();
    }


    // Replace space characters and convert to float
    private static function floatFix($str)
    {
        return floatval(str_replace(" ", "", $str));
    }


    public function uploadstatus()
    {
        $hdrs = [];
        foreach (getallheaders() as $hdrName => $value) {
            $hdrs[strtolower($hdrName)] = $value;
        }
        if (!isset($hdrs["x-file-id"])) {
            wlog("No file id specified");
            exit;
        }

        $fileId = $hdrs["x-file-id"];
        $fname = UPLOAD_PATH . $fileId;

        $totalSize = 0;
        if (file_exists($fname)) {
            $totalSize = filesize($fname);
        }

        echo $totalSize;
        exit;
    }


    public function upload()
    {
        wlog("FastCommitController::upload()");

        if (!$this->isPOST()) {
            return;
        }

        $file_cont = file_get_contents('php://input');
        $hdrs = [];
        foreach (getallheaders() as $hdrName => $value) {
            $hdrs[strtolower($hdrName)] = $value;
        }

        $encodeCP1251 = false;
        if (isset($hdrs["x-file-id"])) {
            $fileId = $hdrs["x-file-id"];
            $fileType = $hdrs["x-file-type"];
            $fileTemplate = $hdrs["x-file-tpl"];
            if (isset($hdrs["x-file-encode"]) && intval($hdrs["x-file-encode"]) == 1) {
                $encodeCP1251 = true;
            }

            $fname = UPLOAD_PATH . $fileId . "." . $fileType;
            $fhnd = fopen($fname, "a");
            if ($fhnd === false) {
                wlog("Can't open file '$fname'");
                exit;
            }
            $bytesWrite = fwrite($fhnd, $file_cont);
            fclose($fhnd);

            $totalSize = filesize($fname);

            // Start process file
            header("Content-type: text/html; charset=UTF-8");
        } else {
            if (!isset($_POST["fileName"]) || !isset($_POST["isCard"])) {
                return;
            }

            $fname = UPLOAD_PATH . $_POST["fileName"];
            $fileType = substr(strrchr($fname, "."), 1);
            $fileTemplate = intval($_POST["template"]);
            $encodeCP1251 = (intval($_POST["encode"]) == 1);
        }

        $fileType = strtoupper($fileType);
        wlog("File type: " . $fileType);

        if ($fileType == "XLS") {
            $readedType = "Xls";
        } elseif ($fileType == "XLSX") {
            $readedType = "Xlsx";
        } elseif ($fileType == "CSV") {
            $readedType = "Csv";
        } else {
            throw new \Error("Unknown file type");
        }

        $reader = IOFactory::createReader($readedType);
        if ($reader instanceof \PhpOffice\PhpSpreadsheet\Reader\Csv) {
            $reader->setDelimiter(';');
            $reader->setEnclosure('');
            if ($encodeCP1251) {
                $reader->setInputEncoding('CP1251');
            }
        }
        $spreadsheet = $reader->load($fname);
        $src = $spreadsheet->getActiveSheet();

        $importTemplate = $this->templateModel->getItem($fileTemplate);
        if (!$importTemplate) {
            throw new \Error("Import template '$fileTemplate' not found");
        }
        $this->applyTemplate($importTemplate);

        $row_ind = 2;

        $data = [];
        do {
            $descVal = $this->getCellValue($src, "desc", $row_ind);
            $edesc = trim($descVal);

            $dataObj = new \stdClass();

            $dateVal = $this->getCellValue($src, "date", $row_ind);
            if (is_empty($dateVal)) {
                break;
            }

            if ($readedType == "Csv") {
                $dateFmt = strtotime($dateVal);
            } else {
                $dateTime = Date::excelToDateTimeObject($dateVal);
                $dateFmt = $dateTime->getTimestamp();
            }

            $dataObj->date = date("d.m.Y", $dateFmt);

            $dataObj->trCurrVal = $this->getCellValue($src, "trCurr", $row_ind);
            $dataObj->trAmountVal = self::floatFix($this->getCellValue($src, "trAmount", $row_ind));
            $dataObj->accCurrVal = $this->getCellValue($src, "accCurr", $row_ind);
            $dataObj->accAmountVal = self::floatFix($this->getCellValue($src, "accAmount", $row_ind));
            $dataObj->descr = $edesc;

            $data[] = $dataObj;

            $row_ind++;
        } while (!is_empty($dateVal));

        if (isset($hdrs["x-file-id"])) {
            unlink($fname);
        }

        echo (JSON::encode($data));
    }
}
