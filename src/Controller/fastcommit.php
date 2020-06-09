<?php

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Shared\Date;


class FastCommitController extends TemplateController
{
	public function index()
	{
		if ($this->isPOST())
		{
			$this->commit();
			return;
		}

		$accMod = AccountModel::getInstance();
		$accArr = $accMod->getData();
		$currMod = CurrencyModel::getInstance();
		$currArr = $currMod->getData();
		$persArr = $this->personMod->getData();

		$this->css->page = "fastcommit.css";
		$this->buildCSS();
		array_push($this->jsArr, "ajax.js", "dragndrop.js", "sortable.js", "fastcommit.js", "convhint.js");

		$titleString = "Jezve Money | Fast Commit";

		include(TPL_PATH."fastcommit.tpl");
	}


	// Short alias for Coordinate::stringFromColumnIndex() method
	private static function columnStr($ind)
	{
		return Coordinate::stringFromColumnIndex($ind);
	}


	// Short alias for Coordinate::columnIndexFromString() method
	private static function columnInd($str)
	{
		return Coordinate::columnIndexFromString($str);
	}


	// Replace space characters and convert to float
	private static function floatFix($str)
	{
		return floatval(str_replace(" ", "", $str));
	}


	public function uploadstatus()
	{
		$hdrs = [];
		foreach(getallheaders() as $hdrName => $value)
		{
			$hdrs[strtolower($hdrName)] = $value;
		}
		if (!isset($hdrs["x-file-id"]))
		{
			wlog("No file id specified");
			exit;
		}

		$fileId = $hdrs["x-file-id"];
		$fname = UPLOAD_PATH.$fileId;

		$totalSize = 0;
		if (file_exists($fname))
		{
			$totalSize = filesize($fname);
		}

		echo $totalSize;
		exit;
	}


	public function upload()
	{
		wlog("FastCommitController::upload()");

		if (!$this->isPOST())
			return;

		$file_cont = file_get_contents('php://input');
		$hdrs = [];
		foreach(getallheaders() as $hdrName => $value)
		{
			$hdrs[strtolower($hdrName)] = $value;
		}

		$encodeCP1251 = FALSE;
		if (isset($hdrs["x-file-id"]))
		{
			$fileId = $hdrs["x-file-id"];
			$fileType = $hdrs["x-file-type"];
			$fileStatType = $hdrs["x-file-stat-type"];
			if (isset($hdrs["x-file-encode"]) && intval($hdrs["x-file-encode"]) == 1)
				$encodeCP1251 = TRUE;

			$fname = UPLOAD_PATH.$fileId.".".$fileType;
			$fhnd = fopen($fname, "a");
			if ($fhnd === FALSE)
			{
				wlog("Can't open file $fname");
				exit;
			}
			$bytesWrite = fwrite($fhnd, $file_cont);
			fclose($fhnd);

			$totalSize = filesize($fname);

			// Start process file
			header("Content-type: text/html; charset=UTF-8");
		}
		else
		{
			if (!isset($_POST["fileName"]) || !isset($_POST["isCard"]))
				return;

			$fname = UPLOAD_PATH.$_POST["fileName"];
			$fileType = substr(strrchr($fname, "."), 1);
			$fileStatType = intval($_POST["statType"]);
			$encodeCP1251 = (intval($_POST["encode"]) == 1);
		}

		$fileType = strtoupper($fileType);
		wlog("File type: ".$fileType);

		if ($fileType == "XLS")
			$readedType = "Xls";
		else if ($fileType == "XLSX")
			$readedType = "Xlsx";
		else if ($fileType == "CSV")
			$readedType = "Csv";
		else
			throw new Error("Unknown file type");

		$reader = IOFactory::createReader($readedType);
		if ($readedType == "Csv")
		{
			$reader->setDelimiter(';');
			$reader->setEnclosure('');
			if ($encodeCP1251)
				$reader->setInputEncoding('CP1251');
		}
		$spreadsheet = $reader->load($fname);
		$src = $spreadsheet->getActiveSheet();

		if ($fileStatType == 1)		// debt card
		{
			$date_col = self::columnStr(1);
			$desc_col = self::columnStr(3);
			$trCurr_col = self::columnStr(7);
			$trAmount_col = self::columnStr(8);
			$accCurr_col = self::columnStr(9);
			$accAmount_col = self::columnStr(10);
		}
		else if ($fileStatType == 2)		// credit card
		{
			$date_col = self::columnStr(1);
			$desc_col = self::columnStr(4);
			$trCurr_col = self::columnStr(8);
			$trAmount_col = self::columnStr(9);
			$accCurr_col = self::columnStr(10);
			$accAmount_col = self::columnStr(11);
		}
		else if ($fileStatType == 0)	// account statement
		{
			$date_col = self::columnStr(1);
			$desc_col = self::columnStr(2);
			$trCurr_col = self::columnStr(3);
			$trAmount_col = self::columnStr(4);
			$accCurr_col = self::columnStr(5);
			$accAmount_col = self::columnStr(6);
		}
		$row_ind = 2;

		$data = [];
		do
		{
			$descVal = $src->getCell($desc_col.$row_ind)->getValue();
			$edesc = trim($descVal);

			$dataObj = new stdClass;

			$dateVal = $src->getCell($date_col.$row_ind)->getValue();
			if (is_empty($dateVal))
				break;

			if ($readedType == "Csv")
			{
				$dateFmt = strtotime($dateVal);
			}
			else
			{
				$dateTime = Date::excelToDateTimeObject($dateVal);
				$dateFmt = $dateTime->getTimestamp();
			}

			$dataObj->date = date("d.m.Y", $dateFmt);

			$dataObj->trCurrVal = $src->getCell($trCurr_col.$row_ind)->getValue();
			$dataObj->trAmountVal = self::floatFix($src->getCell($trAmount_col.$row_ind)->getValue());
			$dataObj->accCurrVal = $src->getCell($accCurr_col.$row_ind)->getValue();
			$dataObj->accAmountVal = self::floatFix($src->getCell($accAmount_col.$row_ind)->getValue());
			$dataObj->descr = $edesc;

			$data[] = $dataObj;

			$row_ind++;
		}
		while(!is_empty($dateVal));

		if (isset($hdrs["x-file-id"]))
			unlink($fname);

		echo(JSON::encode($data));
	}
}
