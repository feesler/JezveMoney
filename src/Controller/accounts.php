<?php

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Shared\Date;


class AccountsController extends TemplateController
{
	protected $requiredFields = [ "name", "initbalance", "curr_id", "icon", "flags" ];


	protected function onStart()
	{
		$this->model = AccountModel::getInstance();
	}


	public function index()
	{
		$transMod = TransactionModel::getInstance();

		$tilesArr = $this->model->getTilesArray();
		$hiddenTilesArr = $this->model->getTilesArray([ "type" => "hidden" ]);

		$titleString = "Jezve Money | Accounts";

		array_push($this->css->libs, "tiles.css", "iconlink.css", "toolbar.css");
		$this->buildCSS();
		array_push($this->jsArr, "selection.js", "currency.js", "toolbar.js", "accounts.js");

		include(TPL_PATH."accounts.tpl");
	}


	public function create()
	{
		if ($this->isPOST())
		{
			$this->createAccount();
			return;
		}

		$action = "new";

		$currMod = CurrencyModel::getInstance();

		$accInfo = new stdClass;
		$accInfo->name = "";
		$accInfo->curr_id = $currMod->getIdByPos(0);
		$accInfo->balance = 0;
		$accInfo->initbalance = 0;
		$accInfo->icon = 0;
		$accInfo->iconclass = "";
		$accInfo->iconname = NULL;
		$accInfo->flags = 0;

		$currObj = $currMod->getItem($accInfo->curr_id);
		if (!$currObj)
			throw new Error("Currency not found");

		$accInfo->sign = $currObj->sign;
		$accInfo->balfmt = $currMod->format($accInfo->balance, $accInfo->curr_id);
		$tileAccName = "New account";

		$currArr = $currMod->getData();
		$icons = $this->model->getIconsArray();

		$titleString = "Jezve Money | ";
		$headString = "New account";
		$titleString .= $headString;

		array_push($this->css->libs, "iconlink.css", "dropdown.css", "tiles.css");
		$this->buildCSS();
		array_push($this->jsArr, "selection.js", "currency.js", "account.js", "dropdown.js", "decimalinput.js", "accounts.js");

		include(TPL_PATH."account.tpl");
	}


	private function fail($msg = NULL)
	{
		if (!is_null($msg))
			Message::set($msg);
		setLocation(BASEURL."accounts/");
	}


	public function update()
	{
		if ($this->isPOST())
		{
			$this->updateAccount();
			return;
		}

		$action = "edit";

		$currMod = CurrencyModel::getInstance();

		$acc_id = intval($this->actionParam);
		if (!$acc_id)
			$this->fail();

		$accInfo = $this->model->getItem($acc_id);

		$currObj = $currMod->getItem($accInfo->curr_id);
		$accInfo->sign = ($currObj) ? $currObj->sign : NULL;
		$accInfo->iconclass = $this->model->getIconClass($accInfo->icon);
		$accInfo->balfmt = $currMod->format($accInfo->balance, $accInfo->curr_id);
		$accInfo->iconname = $this->model->getIconName($accInfo->icon);
		$tileAccName = $accInfo->name;

		$currArr = $currMod->getData();
		$icons = $this->model->getIconsArray();

		$titleString = "Jezve Money | ";
		$headString = "Edit account";
		$titleString .= $headString;

		array_push($this->css->libs, "iconlink.css", "dropdown.css", "tiles.css");
		$this->buildCSS();
		array_push($this->jsArr, "selection.js", "currency.js", "account.js", "dropdown.js", "decimalinput.js", "accounts.js");

		include(TPL_PATH."account.tpl");
	}


	protected function createAccount()
	{
		if (!$this->isPOST())
			setLocation(BASEURL."accounts/");

		$defMsg = ERR_ACCOUNT_CREATE;

		$reqData = checkFields($_POST, $this->requiredFields);
		if ($reqData === FALSE)
			$this->fail($defMsg);

		$uObj = $this->uMod->getItem($this->user_id);
		if (!$uObj)
			$this->fail($defMsg);

		$reqData["owner_id"] = $uObj->owner_id;

		if (!$this->model->create($reqData))
			$this->fail($defMsg);

		Message::set(MSG_ACCOUNT_CREATE);

		setLocation(BASEURL."accounts/");
	}


	protected function updateAccount()
	{
		if (!$this->isPOST())
			setLocation(BASEURL."accounts/");

		$defMsg = ERR_ACCOUNT_UPDATE;

		if (!isset($_POST["id"]))
			$this->fail($defMsg);

		$reqData = checkFields($_POST, $this->requiredFields);
		if ($reqData === FALSE)
			$this->fail($defMsg);

		if (!$this->model->update($_POST["id"], $reqData))
			$this->fail($defMsg);

		Message::set(MSG_ACCOUNT_UPDATE);

		setLocation(BASEURL."accounts/");
	}


	public function show()
	{
		if (!$this->isPOST())
			setLocation(BASEURL."accounts/");

		$defMsg = ERR_ACCOUNT_SHOW;

		if (!isset($_POST["accounts"]))
			$this->fail($defMsg);

		$ids = explode(",", rawurldecode($_POST["accounts"]));
		if (!$this->model->show($ids))
			$this->fail($defMsg);

		setLocation(BASEURL."accounts/");
	}


	public function hide()
	{
		if (!$this->isPOST())
			setLocation(BASEURL."accounts/");

		$defMsg = ERR_ACCOUNT_HIDE;

		if (!isset($_POST["accounts"]))
			$this->fail($defMsg);

		$ids = explode(",", rawurldecode($_POST["accounts"]));
		if (!$this->model->hide($ids))
			$this->fail($defMsg);

		setLocation(BASEURL."accounts/");
	}


	public function del()
	{
		if (!$this->isPOST())
			setLocation(BASEURL."accounts/");

		$defMsg = ERR_ACCOUNT_DELETE;

		if (!isset($_POST["accounts"]))
			fail($defMsg);

		$ids = explode(",", rawurldecode($_POST["accounts"]));
		if (!$this->model->del($ids))
			$this->fail($defMsg);

		Message::set(MSG_ACCOUNT_DELETE);

		setLocation(BASEURL."accounts/");
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


	public function export()
	{
		$transMod = TransactionModel::getInstance();
		$currMod = CurrencyModel::getInstance();
		$spreadsheet = new Spreadsheet();
		$sheet = $spreadsheet->getActiveSheet();

		$ids = $this->getRequestedIds();

		$writerType = "Csv";
		$exportFileName = "Exported_".date("d.m.Y").".".strtolower($writerType);

		$writer = IOFactory::createWriter($spreadsheet, $writerType);
		if ($writerType == "Csv")
		{
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
		foreach($columns as $col_id => $title)
		{
			$colStr[$col_id] = self::columnStr($ind++);
			$sheet->setCellValue($colStr[$col_id].$row_ind, $title);
		}

		// Request transactions data and write to sheet
		$transactionsList = $transMod->getData([ "accounts" => $ids ]);
		foreach($transactionsList as $transaction)
		{
			$row_ind++;

			$sheet->setCellValue($colStr["id"].$row_ind,
									$transaction->id);

			$sheet->setCellValue($colStr["type"].$row_ind,
									TransactionModel::typeToString($transaction->type));

			$sheet->setCellValue($colStr["src_amount"].$row_ind,
									$currMod->format($transaction->src_amount, $transaction->src_curr));

			$sheet->setCellValue($colStr["dest_amount"].$row_ind,
									$currMod->format($transaction->dest_amount, $transaction->dest_curr));

			$sheet->setCellValue($colStr["src_result"].$row_ind,
									$currMod->format($transaction->src_result, $transaction->src_curr));

			$sheet->setCellValue($colStr["dest_result"].$row_ind,
									$currMod->format($transaction->dest_result, $transaction->dest_curr));

			if ($writerType == "Csv")
				$dateFmt = date("d.m.Y", $transaction->date);
			else
				$dateFmt = Date::PHPToExcel($transaction->date);
			$sheet->setCellValue($colStr["date"].$row_ind, $dateFmt);

			$sheet->setCellValue($colStr["comment"].$row_ind, $transaction->comment);
		}

		$spreadsheet->setActiveSheetIndex(0);

		// Redirect output to a client’s web browser (Xlsx)
		if ($writerType == "Csv")
			header('Content-Type: test/csv');
		header("Content-Disposition: attachment;filename=\"$exportFileName\"");
		header("Cache-Control: max-age=0");
		// If serving to IE 9, then the following may be needed
		header("Cache-Control: max-age=1");
		// If serving to IE over SSL, then the following may be needed
		header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");					// Date in the past
		header("Last-Modified: ".gmdate('D, d M Y H:i:s')." GMT");			// always modified
		header("Cache-Control: cache, must-revalidate");		// HTTP/1.1
		header("Pragma: public");								// HTTP/1.0

		$writer->save('php://output');
		exit;
	}
}