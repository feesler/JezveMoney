<?php

require_once("./system/setup.php");

require_once($approot."system/library/phpexcel/PHPExcel.php");

// Short alias for PHPExcel_Cell::stringFromColumnIndex() method
function columnStr($ind)
{
	return PHPExcel_Cell::stringFromColumnIndex($ind);
}


// Short alias for PHPExcel_Cell::columnIndexFromString() method
function columnInd($str)
{
	return PHPExcel_Cell::columnIndexFromString($str) - 1;
}


// Replace space characters and convert to float
function floatFix($str)
{
	return floatval(str_replace(" ", "", $str));
}

header("Content-type: text/html; charset=UTF-8");

$filePath = "/home/users/f/feesler/domains/jezve.net/";

$isCardStatement = TRUE;

if ($isCardStatement)
	$srcFile = $filePath."card_statement_24.02.16-11.01.18.xlsx";
else
	$srcFile = $filePath."account_statement_01.06.16-21.06.17.xlsx";


$srcPHPExcel = PHPExcel_IOFactory::load($srcFile);
$src = $srcPHPExcel->getActiveSheet();

if ($isCardStatement)
{
	$date_col = columnStr(0);
	$desc_col = columnStr(2);
	$trCurr_col = columnStr(6);
	$trAmount_col = columnStr(7);
	$accCurr_col = columnStr(8);
	$accAmount_col = columnStr(9);
}
else	// account statement
{
	$date_col = columnStr(0);
	$desc_col = columnStr(1);
	$trCurr_col = columnStr(2);
	$trAmount_col = columnStr(3);
	$accCurr_col = columnStr(4);
	$accAmount_col = columnStr(5);
}
$row_ind = 2;

$data = array();

do
{
	$descVal = $src->getCell($desc_col.$row_ind)->getValue();
	$edesc = trim($descVal);
	if (is_empty($edesc))
		break;

	$dataObj = new stdClass;

	$dateVal = $src->getCell($date_col.$row_ind)->getValue();
	$dateFmt = PHPExcel_Shared_Date::ExcelToPHP($dateVal);

	$dataObj->date = date("d.m.Y", $dateFmt);

	$dataObj->trCurrVal = $src->getCell($trCurr_col.$row_ind)->getValue();
	$dataObj->trAmountVal = floatFix($src->getCell($trAmount_col.$row_ind)->getValue());
	$dataObj->accCurrVal = $src->getCell($accCurr_col.$row_ind)->getValue();
	$dataObj->accAmountVal = floatFix($src->getCell($accAmount_col.$row_ind)->getValue());
	$dataObj->descr = $edesc;

	$data[] = $dataObj;

/*
	if (strstr($edesc,"RBA ATM"))
	{
		if ($isDiffCurr)
			$cashAcc = "Cash ".$trCurrVal;
		else
			$cashAcc = "Cash";

		if ($fTrAmount > 0)
			$mean = "Transfer from ".$cashAcc;
		else
			$mean = "Transfer to ".$cashAcc;
	}
	else if (strstr($edesc, "MAAJ66"))
	{
		$mean = "IPOTEKA";
	}
*/

	$row_ind++;
}
while(!is_empty($edesc));

echo(f_json_encode($data));
