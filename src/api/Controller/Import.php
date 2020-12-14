<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
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


    // Apply import template
    private function applyTemplate($template)
    {
        if (is_null($template)) {
            throw new \Error("Invalid template");
        }

        $this->setColumnInd("date", $template->dateColumn);
        $this->setColumnInd("comment", $template->commentColumn);
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
        if (!$this->isPOST()) {
            return;
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
                if (
                    (!$this->uMod->isAdmin($this->user_id)
                        && !$this->uMod->isTester($this->user_id))
                    || !isset($_POST["filename"])
                    || !isset($_POST["template"])
                    || !isset($_POST["encode"])
                ) {
                    throw new \Error("Invalid request");
                }

                $fname = UPLOAD_PATH . $_POST["filename"];
                $fileExt = strrchr($fname, ".");
                $fileType = ($fileExt === false) ? "" : substr($fileExt, 1);
                $fileTemplate = intval($_POST["template"]);
                $encodeCP1251 = (intval($_POST["encode"]) == 1);

                if (!file_exists($fname) || !is_readable($fname)) {
                    throw new \Error("File not found");
                }
            }

            // Start process file
            header("Content-type: text/html; charset=UTF-8");

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
                $dateVal = $this->getCellValue($src, "date", $row_ind);
                if (is_empty($dateVal)) {
                    break;
                }

                $dataObj = new \stdClass();

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

                $commentVal = $this->getCellValue($src, "comment", $row_ind);
                $dataObj->comment = trim($commentVal);

                $data[] = $dataObj;

                $row_ind++;
            } while (!is_empty($dateVal));

            $this->setData($data);
        } catch (\Error $e) {
            $this->fail($e->getMessage());
        }

        if (isset($hdrs["x-file-id"])) {
            unlink($fname);
        }

        $this->ok();
    }
}
