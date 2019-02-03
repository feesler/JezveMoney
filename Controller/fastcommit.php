<?php

require_once(APPROOT."system/library/phpexcel/PHPExcel.php");

class FastCommitController extends Controller
{
	public function index()
	{
		global $user_id;

		if ($_SERVER["REQUEST_METHOD"] == "POST")
		{
			$this->commit();
			return;
		}

		$accMod = new AccountModel($user_id, FALSE);
		$accArr = $accMod->getArray();
		$currMod = new CurrencyModel();
		$currArr = $currMod->getArray();
		$pMod = new PersonModel($user_id);
		$persArr = $pMod->getArray();

		$this->css->page = "fastcommit.css";
		$this->buildCSS();
		array_push($this->jsArr, "json2.js", "ajax.js", "dragndrop.js", "sortable.js", "fastcommit.js", "convhint.js");

		$titleString = "Jezve Money | Fast Commit";

		include("./view/templates/fastcommit.tpl");
	}


	// Short alias for PHPExcel_Cell::stringFromColumnIndex() method
	private static function columnStr($ind)
	{
		return PHPExcel_Cell::stringFromColumnIndex($ind);
	}


	// Short alias for PHPExcel_Cell::columnIndexFromString() method
	private static function columnInd($str)
	{
		return PHPExcel_Cell::columnIndexFromString($str) - 1;
	}


	// Replace space characters and convert to float
	private static function floatFix($str)
	{
		return floatval(str_replace(" ", "", $str));
	}


	public function uploadstatus()
	{
		$hdrs = getallheaders();
		if (!isset($hdrs["X-File-Id"]))
		{
			wlog("No file id specified");
			exit;
		}

		$fileId = $hdrs["X-File-Id"];
		$fname = APPPATH."system/upload/".$fileId;

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

		if ($_SERVER["REQUEST_METHOD"] != "POST")
			return;

		$file_cont = file_get_contents('php://input');
		$hdrs = getallheaders();
		if (isset($hdrs["X-File-Id"]))
		{
			$fileId = $hdrs["X-File-Id"];
			$fileType = $hdrs["X-File-Type"];
			$fileStatType = $hdrs["X-File-Stat-Type"];

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

		wlog("File type: ".$fileType);

		if (strtoupper($fileType) == "XLS")
			$readedType = "Excel5";
		else if (strtoupper($fileType) == "XLSX")
			$readedType = "Excel2007";
		else if (strtoupper($fileType) == "CSV")
			$readedType = "CSV";

		$objReader = PHPExcel_IOFactory::createReader($readedType);
		if ($readedType == "CSV")
			$objReader->setDelimiter(";");
		$srcPHPExcel = $objReader->load($fname);
		$src = $srcPHPExcel->getActiveSheet();

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

		$data = array();
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
			if ($readedType == "CSV")
				$dateFmt = strtotime($dateVal);
			else
				$dateFmt = PHPExcel_Shared_Date::ExcelToPHP($dateVal);
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

		if (isset($hdrs["X-File-Id"]))
			unlink($fname);

		echo(f_json_encode($data));
	}


	public function commit()
	{
		global $user_id;

		if ($_SERVER["REQUEST_METHOD"] != "POST")
			return;

		header("Content-type: text/html; charset=utf-8");

		$accMod = new AccountModel($user_id, FALSE);
		$trMod = new TransactionModel($user_id);
		$debtMod = new DebtModel($user_id);
		$pMod = new PersonModel($user_id);
		$currMod = new CurrencyModel();

		$acc_id = intval($_POST["acc_id"]);
		echo("Account: ".$acc_id." ".$accMod->getName($acc_id)."<br>");
		$curr_id = $accMod->getCurrency($acc_id);
		echo("Currency: ".$curr_id." ".$currMod->getName($curr_id)."<br><br>");
		foreach($_POST["tr_type"] AS $tr_key => $tr_type)
		{
			$tr_amount = floatval($_POST["amount"][$tr_key]);

			$tr_time = strtotime($_POST["date"][$tr_key]);
			if ($tr_time == -1)
			{
				echo("Wrong date format: ".$_POST["date"][$tr_key]);
				break;
			}

			$tr_date =  date("Y-m-d H:i:s", $tr_time);
			$tr_comment = $_POST["comment"][$tr_key];
			echo("Transaction #".$tr_key." : ".$tr_type."<br>");

			if ($tr_type == "expense")
			{
				$tr_dest_curr_id = intval($_POST["curr_id"][$tr_key]);
				if ($tr_dest_curr_id != $curr_id)
				{
					$tr_dest_amount = floatval($_POST["dest_amount"][$tr_key]);
				}
				else
				{
					$tr_dest_amount = $tr_amount;
				}

				echo("src_amount: ".$tr_amount."; dest_amount: ".$tr_dest_amount."; src_curr: ".$curr_id."; dest_curr ".$tr_dest_curr_id);
				echo("; ".$tr_date." ".$tr_comment."<br>");

				$trans_id = $trMod->create(EXPENSE, $acc_id, 0, $tr_amount, $tr_dest_amount, $curr_id, $tr_dest_curr_id, $tr_date, $tr_comment);
			}
			else if ($tr_type == "income")
			{
				$tr_src_curr_id = intval($_POST["curr_id"][$tr_key]);
				if ($tr_src_curr_id != $curr_id)
				{
					$tr_src_amount = floatval($_POST["dest_amount"][$tr_key]);
				}
				else
				{
					$tr_src_amount = $tr_amount;
				}
				echo("src_amount: ".$tr_src_amount."; dest_amount: ".$tr_amount."; src_curr: ".$tr_src_curr_id."; dest_curr ".$curr_id);
				echo("; ".$tr_date." ".$tr_comment."<br>");

				$trans_id = $trMod->create(INCOME, 0, $acc_id, $tr_src_amount, $tr_amount, $tr_src_curr_id, $curr_id, $tr_date, $tr_comment);
			}
			else if ($tr_type == "transferfrom" || $tr_type == "transferto")
			{
				if ($tr_type == "transferfrom")
				{
					$tr_src_acc_id = $acc_id;
					$tr_src_curr_id = $curr_id;
					$tr_dest_acc_id = intval($_POST["dest_acc_id"][$tr_key]);
					$tr_dest_curr_id = $accMod->getCurrency($tr_dest_acc_id);
					$tr_src_amount = $tr_amount;
					$tr_dest_amount = ($tr_dest_curr_id != $tr_src_curr_id) ? floatval($_POST["dest_amount"][$tr_key]) : $tr_amount;

					echo("Dest account: ".$tr_dest_acc_id." ".$accMod->getName($tr_dest_acc_id)."<br>");
				}
				else
				{
					$tr_src_acc_id = intval($_POST["dest_acc_id"][$tr_key]);
					$tr_src_curr_id = $accMod->getCurrency($tr_src_acc_id);
					$tr_dest_acc_id = $acc_id;
					$tr_dest_curr_id = $curr_id;
					$tr_src_amount = ($tr_dest_curr_id != $tr_src_curr_id) ? floatval($_POST["dest_amount"][$tr_key]) : $tr_amount;
					$tr_dest_amount = $tr_amount;

					echo("Source account: ".$tr_src_acc_id." ".$accMod->getName($tr_src_acc_id)."<br>");
				}

				echo("src_amount: ".$tr_src_amount."; dest_amount: ".$tr_dest_amount."; src_curr: ".$tr_src_curr_id."; dest_curr ".$tr_dest_curr_id);
				echo("; ".$tr_date." ".$tr_comment."<br>");

				$trans_id = $trMod->create(TRANSFER,
											$tr_src_acc_id, $tr_dest_acc_id,
											$tr_src_amount, $tr_dest_amount,
											$tr_src_curr_id, $tr_dest_curr_id,
											$tr_date, $tr_comment);
			}
			else if ($tr_type == "debtfrom" || $tr_type == "debtto")
			{
				$op = ($tr_type == "debtfrom") ? 2 : 1;
				$person_id = intval($_POST["person_id"][$tr_key]);
				$tr_src_amount = $tr_dest_amount = $tr_amount;
				$tr_src_curr_id = $tr_dest_curr_id = $curr_id;

				echo(($op ? "give" : "take")."; person: ".$person_id." ".$pMod->getName($person_id)."<br>");

				$trans_id = $debtMod->create($op, $acc_id, $person_id,
									$tr_src_amount, $tr_dest_amount,
									$tr_src_curr_id, $tr_dest_curr_id,
									$tr_date, $tr_comment);
			}
			else
			{
				echo("Wrong transaction type<br>");
				break;
			}

			if ($trans_id == 0)
			{
				echo("Fail to create transaction<br>");
				break;
			}
			else
				echo("New transaction id: ".$trans_id."<br>");
			echo("<br>");
		}

		echo("<a href=\"".BASEURL."fastcommit/\">Ok</a><br>");
	}
}
