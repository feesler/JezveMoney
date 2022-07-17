<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\ImportTemplateModel;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Shared\Date;

class Import extends ApiController
{
    protected $templateModel = null;
    protected $columns = [
        "date" => null,
        "comment" => null,
        "trCurr" => null,
        "trAmount" => null,
        "accCurr" => null,
        "accAmount" => null,
    ];


    public function initAPI()
    {
        parent::initAPI();

        $this->templateModel = ImportTemplateModel::getInstance();
    }


    // Set index of specified column
    private function setColumnInd($colName, $ind)
    {
        if (is_empty($colName)) {
            throw new \Error("Invalid column name: " . $colName);
        }

        $this->columns[$colName] = intval($ind);
    }


    // Apply import template
    private function applyTemplate($template)
    {
        if (is_null($template)) {
            throw new \Error("Invalid template");
        }

        $this->setColumnInd("date", $template->columns["date"]);
        $this->setColumnInd("comment", $template->columns["comment"]);
        $this->setColumnInd("trCurr", $template->columns["transactionCurrency"]);
        $this->setColumnInd("trAmount", $template->columns["transactionAmount"]);
        $this->setColumnInd("accCurr", $template->columns["accountCurrency"]);
        $this->setColumnInd("accAmount", $template->columns["accountAmount"]);
    }


    // Return value from cell at specified column and row
    private function getCellValue($sheet, $colName, $rowIndex)
    {
        if (!$sheet) {
            throw new \Error("Invalid sheet");
        }
        if (!isset($this->columns[$colName])) {
            throw new \Error("Invalid column " . $colName);
        }

        return $sheet->getCellByColumnAndRow($this->columns[$colName], intval($rowIndex))->getValue();
    }


    // Replace space characters and convert to float
    private static function floatFix($str)
    {
        return floatval(str_replace(" ", "", $str));
    }


    private function createReader($fileType, $encodeCP1251)
    {
        $fileType = strtoupper($fileType);
        if ($fileType == "XLS") {
            $readedType = "Xls";
        } elseif ($fileType == "XLSX") {
            $readedType = "Xlsx";
        } elseif ($fileType == "CSV") {
            $readedType = "Csv";
        } else {
            throw new \Error("Unknown file type: $fileType");
        }

        $reader = IOFactory::createReader($readedType);
        if ($reader instanceof \PhpOffice\PhpSpreadsheet\Reader\Csv) {
            $reader->setDelimiter(';');
            $reader->setEnclosure('');
            if ($encodeCP1251) {
                $reader->setInputEncoding('CP1251');
            }
        }

        return $reader;
    }


    private function readWithTemplate($reader, $fileName, $fileTemplate)
    {
        if (!$reader) {
            throw new \Error("Invalid reader");
        }

        $spreadsheet = $reader->load($fileName);
        $src = $spreadsheet->getActiveSheet();

        $importTemplate = $this->templateModel->getItem($fileTemplate);
        if (!$importTemplate) {
            throw new \Error("Import template '$fileTemplate' not found");
        }
        $this->applyTemplate($importTemplate);

        $res = [];
        $lastRow = $src->getHighestRow();
        $rowIndex = 2;
        do {
            $dateVal = $this->getCellValue($src, "date", $rowIndex);
            if (is_empty($dateVal)) {
                break;
            }

            $dataObj = new \stdClass();

            if ($reader instanceof \PhpOffice\PhpSpreadsheet\Reader\Csv) {
                $dateFmt = strtotime($dateVal);
            } else {
                $dateTime = Date::excelToDateTimeObject($dateVal);
                $dateFmt = $dateTime->getTimestamp();
            }

            $dataObj->date = date("d.m.Y", $dateFmt);

            $dataObj->trCurrVal = $this->getCellValue($src, "trCurr", $rowIndex);
            $dataObj->trAmountVal = self::floatFix($this->getCellValue($src, "trAmount", $rowIndex));
            $dataObj->accCurrVal = $this->getCellValue($src, "accCurr", $rowIndex);
            $dataObj->accAmountVal = self::floatFix($this->getCellValue($src, "accAmount", $rowIndex));

            $commentVal = $this->getCellValue($src, "comment", $rowIndex);
            $dataObj->comment = trim($commentVal);

            $res[] = $dataObj;

            $rowIndex++;
        } while ($rowIndex <= $lastRow);

        return $res;
    }


    private function readRaw($reader, $fileName)
    {
        if (!$reader) {
            throw new \Error("Invalid reader");
        }

        $spreadsheet = $reader->load($fileName);
        $src = $spreadsheet->getActiveSheet();

        $res = [];
        $lastColumn = $src->getHighestColumn();
        $lastColumnInd = Coordinate::columnIndexFromString($lastColumn);
        $lastRow = $src->getHighestRow();
        $rowIndex = 1;
        do {
            $rowData = [];

            for ($col = 1; $col <= $lastColumnInd; $col++) {
                $val = $src->getCellByColumnAndRow($col, $rowIndex)->getValue();
                if (is_null($val)) {
                    $val = "";
                }

                $rowData[] = $val;
            }

            $res[] = $rowData;
            $rowIndex++;
        } while ($rowIndex <= $lastRow);

        return $res;
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
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $hdrs = [];
        foreach (getallheaders() as $hdrName => $value) {
            $hdrs[strtolower($hdrName)] = $value;
        }

        try {
            if (isset($hdrs["x-file-id"])) {
                $encodeCP1251 = false;
                $file_cont = file_get_contents('php://input');
                $fileId = $hdrs["x-file-id"];
                $fileType = $hdrs["x-file-type"];
                $fileTemplate = $hdrs["x-file-tpl"];
                if (isset($hdrs["x-file-encode"]) && intval($hdrs["x-file-encode"]) == 1) {
                    $encodeCP1251 = true;
                }

                $fname = UPLOAD_PATH . $fileId . "." . $fileType;

                // Save uploaded content to file
                $fhnd = fopen($fname, "a");
                if ($fhnd === false) {
                    throw new \Error("Fail to open file");
                }
                fwrite($fhnd, $file_cont);
                fclose($fhnd);
            } else {
                $request = $this->getRequestData();
                if (
                    (!$this->uMod->isAdmin($this->user_id)
                        && !$this->uMod->isTester($this->user_id))
                    || !isset($request["filename"])
                    || !isset($request["template"])
                    || !isset($request["encode"])
                ) {
                    throw new \Error("Invalid request");
                }

                $fname = UPLOAD_PATH . $request["filename"];
                $fileExt = strrchr($fname, ".");
                $fileType = ($fileExt === false) ? "" : substr($fileExt, 1);
                $fileTemplate = intval($request["template"]);
                $encodeCP1251 = (intval($request["encode"]) == 1);

                if (!file_exists($fname) || !is_readable($fname)) {
                    throw new \Error("File not found");
                }
            }

            // Start process file
            $reader = $this->createReader($fileType, $encodeCP1251);
            if ($fileTemplate != 0) {
                $data = $this->readWithTemplate($reader, $fname, $fileTemplate);
            } else {
                $data = $this->readRaw($reader, $fname);
            }

            $this->setData($data);
        } catch (\Error $e) {
            throw new \Error($e->getMessage());
        }

        if (isset($hdrs["x-file-id"])) {
            unlink($fname);
        }

        $this->ok();
    }
}
