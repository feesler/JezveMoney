<?php

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Shared\Date;


class FastCommitController extends Controller
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

		include("./view/templates/fastcommit.tpl");
	}


	// Short alias for Coordinate::stringFromColumnIndex() method
	private static function columnStr($ind)
	{
		return Coordinate::stringFromColumnIndex($ind);
	}


	// Short alias for Coordinate::columnIndexFromString() method
	private static function columnInd($str)
	{
		return Coordinate::columnIndexFromString($str) - 1;
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
		$fname = APPROOT."system/uploads/".$fileId;

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

		if (isset($hdrs["x-file-id"]))
		{
			$fileId = $hdrs["x-file-id"];
			$fileType = $hdrs["x-file-type"];
			$fileStatType = $hdrs["x-file-stat-type"];

			$fname = APPROOT."system/uploads/".$fileId.".".$fileType;
			$fhnd = fopen($fname, "a");
			if ($fhnd === FALSE)
			{
				wlog("No file id specified");
				exit;
			}
			$bytesWrite = fwrite($fhnd, $file_cont);
			fclose($fhnd);
			wlog("Bytes written: ".$bytesWrite);
			$totalSize = filesize($fname);

			// Start process file
			header("Content-type: text/html; charset=UTF-8");
			$isCardStatement = (strcmp($fileStatType, "card") == 0 );
		}
		else
		{
			if (!isset($_POST["fileName"]) || !isset($_POST["isCard"]))
				return;

			$fname = APPROOT."system/uploads/".$_POST["fileName"];
			$fileType = substr(strrchr($fname, "."), 1);
			$isCardStatement = (strcmp($_POST["isCard"], "card") == 0);
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
			$reader->setDelimiter(';');
		$spreadsheet = $reader->load($fname);
		$src = $spreadsheet->getActiveSheet();

		if ($isCardStatement)
		{
			$date_col = self::columnStr(0);
			$desc_col = self::columnStr(2);
			$trCurr_col = self::columnStr(6);
			$trAmount_col = self::columnStr(7);
			$accCurr_col = self::columnStr(8);
			$accAmount_col = self::columnStr(9);
		}
		else	// account statement
		{
			$date_col = self::columnStr(0);
			$desc_col = self::columnStr(1);
			$trCurr_col = self::columnStr(2);
			$trAmount_col = self::columnStr(3);
			$accCurr_col = self::columnStr(4);
			$accAmount_col = self::columnStr(5);
		}
		$row_ind = 2;

		$data = [];
		do
		{
			$descVal = $src->getCell($desc_col.$row_ind)->getValue();
			wlog("Descr(".$desc_col.$row_ind."): ".$descVal);
			$edesc = trim($descVal);
			if (is_empty($edesc))
				break;

			$dataObj = new stdClass;

			$dateVal = $src->getCell($date_col.$row_ind)->getValue();
			wlog("Date(".$desc_col.$row_ind."): ".$dateVal);
			if ($readedType == "Csv")
			{
				$dateFmt = strtotime($dateVal);
			}
			else
			{
				$dateTime = Date::excelToDateTimeObject($dateVal);
				$dateFmt = $dateTime->getTimestamp();
			}
			wlog("Formatted: ".$dateFmt.", ".date("d.m.Y", $dateFmt));

			$dataObj->date = date("d.m.Y", $dateFmt);

			$dataObj->trCurrVal = $src->getCell($trCurr_col.$row_ind)->getValue();
			$dataObj->trAmountVal = self::floatFix($src->getCell($trAmount_col.$row_ind)->getValue());
			$dataObj->accCurrVal = $src->getCell($accCurr_col.$row_ind)->getValue();
			$dataObj->accAmountVal = self::floatFix($src->getCell($accAmount_col.$row_ind)->getValue());
			$dataObj->descr = $edesc;

			$data[] = $dataObj;

			$row_ind++;
		}
		while(!is_empty($edesc));

		if (isset($hdrs["x-file-id"]))
			unlink($fname);

		echo(JSON::encode($data));
	}
}
