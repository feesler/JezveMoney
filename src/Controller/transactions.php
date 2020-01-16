<?php

class TransactionsController extends Controller
{
	protected function onStart()
	{
		$this->model = TransactionModel::getInstance();
		$this->accModel = AccountModel::getInstance();
		$this->currModel = CurrencyModel::getInstance();
	}


	public function index()
	{
		$filterObj = new stdClass;
		$trParams = [ "onPage" => 10,
						"desc" => TRUE ];

		// Obtain requested transaction type filter
		$filterObj->type = (isset($_GET["type"])) ? $_GET["type"] : "all";

		$trParams["type"] = TransactionModel::getStringType($filterObj->type);
		if (is_null($trParams["type"]))
			$this->fail();

		// Obtain requested page number
		if (isset($_GET["page"]))
		{
			$filterObj->page = intval($_GET["page"]);
			if ($filterObj->page > 1)
				$trParams["page"] = $filterObj->page - 1;
		}

		// Prepare array of requested accounts filter
		$accFilter = [];
		if (isset($_GET["acc_id"]))
		{
			$accExpl = explode(",", rawurldecode($_GET["acc_id"]));
			foreach($accExpl as $acc_id)
			{
				$acc_id = intval(trim($acc_id));
				if ($acc_id && $this->accModel->is_exist($acc_id))
					$accFilter[] = $acc_id;
			}

			if (count($accFilter) > 0)
				$trParams["accounts"] = $filterObj->acc_id = $accFilter;
		}

		// Obtain requested search query
		$searchReq = (isset($_GET["search"]) ? $_GET["search"] : NULL);
		if (!is_null($searchReq))
		{
			$trParams["search"] = $filterObj->search = $searchReq;
		}

		// Obtain requested date range
		$stDate = (isset($_GET["stdate"]) ? $_GET["stdate"] : NULL);
		$endDate = (isset($_GET["enddate"]) ? $_GET["enddate"] : NULL);

		$dateFmt = "";
		if (!is_null($stDate) && !is_null($endDate))
		{
			$sdate = strtotime($stDate);
			$edate = strtotime($endDate);
			if ($sdate != -1 && $edate != -1)
				$dateFmt = date("d.m.Y", $sdate)." - ".date("d.m.Y", $edate);

			$trParams["startDate"] = $filterObj->stdate = $stDate;
			$trParams["endDate"] = $filterObj->enddate = $endDate;
		}

		// Obtain requested view mode
		$showDetails = FALSE;
		if (isset($_GET["mode"]) && $_GET["mode"] == "details")
		{
			$showDetails = TRUE;
			$filterObj->mode = "details";
		}

		$accArr = $this->accModel->getData();
		$accounts = $this->accModel->getCount();

		$totalTrCount = $this->model->getCount();

		$transArr = ($totalTrCount) ? $this->model->getData($trParams) : [];
		$transCount = $this->model->getTransCount($trParams);

		$currArr = $this->currModel->getData();

		// Prepare transaction types menu
		$trTypes = ["All", "Expense", "Income", "Transfer", "Debt"];
		$transMenu = [];
		$baseUrl = BASEURL."transactions/";
		foreach($trTypes as $ind => $trTypeName)
		{
			$urlParams = (array)$filterObj;

			$urlParams["type"] = strtolower($trTypeName);
			if (isset($urlParams["acc_id"]))
				$urlParams["acc_id"] = implode(",", $urlParams["acc_id"]);

			// Clear page number because list of transactions guaranteed to change on change accounts filter
			unset($urlParams["page"]);

			$menuItem = new stdClass;
			$menuItem->ind = $ind;
			$menuItem->title = $trTypeName;
			$menuItem->url = urlJoin($baseUrl, $urlParams);

			$transMenu[] = $menuItem;
		}

		$showPaginator = TRUE;
		$details = $showDetails;

		// Prepare mode selector and paginator
		if ($showPaginator == TRUE)
		{
			// Prepare classic/details mode link
			$urlParams = (array)$filterObj;

			$urlParams["mode"] = ($details) ? "classic" : "details";
			if (isset($urlParams["acc_id"]) && count($urlParams["acc_id"]) > 0)
				$urlParams["acc_id"] = implode(",", $urlParams["acc_id"]);

			$linkStr = urlJoin(BASEURL."transactions/", $urlParams);

			// Build data for paginator
			if ($trParams["onPage"] > 0)
			{
				$urlParams = (array)$filterObj;

				$pageCount = ceil($transCount / $trParams["onPage"]);
				$page_num = isset($trParams["page"]) ? intval($trParams["page"]) : 0;
				$pagesArr = ($transCount > $trParams["onPage"]) ? $this->model->getPaginatorArray($page_num, $pageCount) : [];

				if (isset($urlParams["acc_id"]))
					$urlParams["acc_id"] = implode(",", $urlParams["acc_id"]);

				foreach($pagesArr as $ind => $pageItem)
				{
					if (is_numeric($pageItem["text"]) && !$pageItem["active"])
					{
						$urlParams["page"] = intval($pageItem["text"]);

						$pagesArr[$ind]["link"] = urlJoin(BASEURL."transactions/", $urlParams);
					}
				}
			}
		}

		// Prepare data of transaction list items
		$trListData = [];
		foreach($transArr as $trans)
		{
			$itemData = ["id" => $trans->id];

			// Build accounts string
			$accStr = "";
			if ($trans->src_id != 0)
			{
				if ($trans->type == EXPENSE || $trans->type == TRANSFER)		// expense or transfer
					$accStr .= $this->accModel->getNameOrPerson($trans->src_id);
				else if ($trans->type == DEBT)
					$accStr .= $this->accModel->getNameOrPerson($trans->src_id);
			}

			if ($trans->src_id != 0 && $trans->dest_id != 0 && ($trans->type == TRANSFER || $trans->type == DEBT))
				$accStr .= " → ";

			if ($trans->dest_id != 0)
			{
				if ($trans->type == INCOME || $trans->type == TRANSFER)		// income or transfer
					$accStr .= $this->accModel->getNameOrPerson($trans->dest_id);
				else if ($trans->type == DEBT)
					$accStr .= $this->accModel->getNameOrPerson($trans->dest_id);
			}

			$itemData["acc"] = $accStr;

			// Build amount string
			$amStr = $trans->fsrcAmount;
			if ($trans->fsrcAmount != $trans->fdestAmount)
				$amStr .= " (".$trans->fdestAmount.")";
			$itemData["amount"] = $amStr;

			$itemData["date"] = $trans->date;
			$itemData["comm"] = $trans->comment;

			if ($details)
			{
				$itemData["balance"] = [];

				if ($trans->src_id != 0)
				{
					$itemData["balance"][] = $this->currModel->format($trans->src_balance, $trans->src_curr);
				}

				if ($trans->dest_id != 0)
				{
					$itemData["balance"][] = $this->currModel->format($trans->dest_balance, $trans->dest_curr);
				}
			}


			$trListData[] = $itemData;
		}

		$titleString = "Jezve Money | Transactions";

		array_push($this->css->libs, "tiles.css", "iconlink.css", "calendar.css", "ddlist.css", "trlist.css", "toolbar.css");
		$this->css->page[] = "transaction.css";
		$this->buildCSS();
		array_push($this->jsArr, "selection.js", "currency.js", "account.js", "calendar.js", "dragndrop.js",
									"sortable.js", "toolbar.js", "ddlist.js", "tr_list.js");

		include("./view/templates/transactions.tpl");
	}


	private function fail($msg = NULL)
	{
		if (!is_null($msg))
			setMessage($msg);
		setLocation(BASEURL);
	}


	public function create()
	{
		if ($_SERVER["REQUEST_METHOD"] == "POST")
		{
			$this->createTransaction();
			return;
		}

		$action = "new";

		$defMsg = ERR_TRANS_CREATE;

		$tr = [ "src_amount" => 0,
				"dest_amount" => 0,
				"comment" => "" ];

		// check predefined type of transaction
		$type_str = (isset($_GET["type"])) ? $_GET["type"] : "expense";
		$tr["type"] = TransactionModel::getStringType($type_str);
		if (!$tr["type"])
		{
			$type_str = "expense";
			$tr["type"] = TransactionModel::getStringType($type_str);
		}
		if (!$tr["type"])
			$this->fail($defMsg);

		// check predefined account
		$acc_id = 0;
		if (isset($_GET["acc_id"]))
			$acc_id = intval($_GET["acc_id"]);
		if (!$acc_id || !$this->accModel->is_exist($acc_id))		// TODO : think about redirect or warning message
			$acc_id = $this->accModel->getIdByPos(0);
		if (!$acc_id)
			$this->fail($defMsg);

		if ($tr["type"] == DEBT)
		{
			$debtMod = DebtModel::getInstance();

			$debtAcc = $this->accModel->getProperties($acc_id);

			// Prepare person account
			$person_id = $this->personMod->getIdByPos(0);
			$pObj = $this->personMod->getItem($person_id);
			$person_name = ($pObj) ? $pObj->name : NULL;

			$person_acc_id = $this->personMod->getAccount($person_id, $debtAcc->curr);
			$person_acc = $this->accModel->getProperties($person_acc_id);
			$person_res_balance = ($person_acc) ? $person_acc->balance : 0.0;
			$person_balance = $person_res_balance;

			$tr["src_id"] = $person_acc_id;
			$tr["dest_id"] = $acc_id;
			$tr["src_curr"] = $debtAcc->curr;
			$tr["dest_curr"] = $debtAcc->curr;

			$give = TRUE;
		}
		else
		{
			$person_id = 0;
			// set source and destination accounts
			$src_id = 0;
			$dest_id = 0;
			if ($tr["type"] == EXPENSE || $tr["type"] == TRANSFER)
				$src_id = ($acc_id ? $acc_id : $this->accModel->getIdByPos(0));
			else if ($tr["type"] == INCOME)		// income
				$dest_id = ($acc_id ? $acc_id : $this->accModel->getIdByPos(0));

			if ($tr["type"] == TRANSFER)
				$dest_id = $this->accModel->getAnother($src_id);

			$tr["src_id"] = $src_id;
			$tr["dest_id"] = $dest_id;
			$tr["comment"] = "";

			if ($src_id != 0)
			{
				$accObj = $this->accModel->getItem($src_id);
				if ($accObj)
					$tr["src_curr"] = $accObj->curr_id;
			}

			if ($dest_id != 0)
			{
				$accObj = $this->accModel->getItem($dest_id);
				if ($accObj)
					$tr["dest_curr"] = $accObj->curr_id;
			}

			if ($tr["type"] == EXPENSE)
				$tr["dest_curr"] = $tr["src_curr"];
			else if ($tr["type"] == INCOME)
				$tr["src_curr"] = $tr["dest_curr"];
		}

		$acc_count = $this->accModel->getCount();

		if ($tr["type"] != DEBT)
		{
			// get information about source and destination accounts
			$src = $this->accModel->getProperties($tr["src_id"]);
			$dest = $this->accModel->getProperties($tr["dest_id"]);
		}

		// Prepare transaction types menu
		$trTypes = ["Expense", "Income", "Transfer", "Debt"];
		$transMenu = [];
		$baseUrl = BASEURL."transactions/new/";
		foreach($trTypes as $ind => $trTypeName)
		{
			$params = ["type" => strtolower($trTypeName)];
			if ($acc_id != 0)
				$params["acc_id"] = $acc_id;

			$menuItem = new stdClass;
			$menuItem->ind = $ind + 1;
			$menuItem->title = $trTypeName;
			$menuItem->url = urlJoin($baseUrl, $params);

			$transMenu[] = $menuItem;
		}

		$formAction = BASEURL."transactions/".$action."/?type=".$type_str;

		if ($tr["type"] == EXPENSE || $tr["type"] == TRANSFER || $tr["type"] == DEBT)
		{
			$srcBalTitle = "Result balance";
			if ($tr["type"] == TRANSFER)
				$srcBalTitle .= " (Source)";
			else if ($tr["type"] == DEBT)
				$srcBalTitle .= ($give) ? " (Person)" : " (Account)";

			$balDiff = $tr["src_amount"];
			if ($tr["type"] != DEBT)
				$src->balfmt = $this->currModel->format($src->balance + $balDiff, $src->curr);
		}

		if ($tr["type"] == INCOME || $tr["type"] == TRANSFER || $tr["type"] == DEBT)
		{
			$destBalTitle = "Result balance";
			if ($tr["type"] == TRANSFER)
				$destBalTitle .= " (Destination)";
			else if ($tr["type"] == DEBT)
				$destBalTitle .= ($give) ? " (Account)" : " (Person)";

			$balDiff = $tr["dest_amount"];
			if ($tr["type"] != DEBT && !is_null($dest))
				$dest->balfmt = $this->currModel->format($dest->balance - $balDiff, $dest->curr);
		}

		$transAcc_id = 0;		// main transaction account id
		$transAccCurr = 0;		// currency of transaction account

		if ($tr["type"] != DEBT)
		{
			$transCurr = (($tr["type"] == EXPENSE) ? $src->curr : $dest->curr);
			$transAccCurr = (($tr["type"] == EXPENSE) ? $src->curr : $dest->curr);

			$srcAmountCurr = (!is_null($src)) ? $src->curr : $dest->curr;
			$destAmountCurr = (!is_null($dest)) ? $dest->curr : $src->curr;

			// Show destination amount for expense and source amount for income by default because it's amount with changing currency.
			// Meanwhile source amount for expense and destination amount for income always have the same currency as account.
			$showSrcAmount = ($tr["type"] != EXPENSE);
			if ($tr["type"] == TRANSFER)
				$showDestAmount = ($srcAmountCurr != $destAmountCurr);
			else
				$showDestAmount = ($tr["type"] != INCOME);
		}
		else
		{
			$tr["src_id"] = $person_acc_id;

			$noAccount = FALSE;

			$srcAmountCurr = $debtAcc->curr;
			$destAmountCurr = $debtAcc->curr;

			$showSrcAmount = TRUE;
			$showDestAmount = FALSE;
		}

		// Common arrays
		$currArr = $this->currModel->getData();

		$accArr = $this->accModel->getData();
		if ($tr["type"] == DEBT)
			$persArr = $this->personMod->getData();

		$srcAmountLbl = ($showSrcAmount && $showDestAmount) ? "Source amount" : "Amount";
		$destAmountLbl = ($showSrcAmount && $showDestAmount) ? "Destination amount" : "Amount";

		if ($tr["type"] == DEBT)
		{
			if ($noAccount)
			{
				$accLbl = "No account";
			}
			else
			{
				if ($give)
					$accLbl = "Destination account";
				else
					$accLbl = "Source account";
			}

			$debtAcc->balfmt = $this->currModel->format($debtAcc->balance + $tr["dest_amount"], $debtAcc->curr);

			$p_balfmt = $this->currModel->format($person_balance, $srcAmountCurr);
		}

		$currObj = $this->currModel->getItem($srcAmountCurr);
		$srcAmountSign = $currObj ? $currObj->sign : NULL;

		$currObj = $this->currModel->getItem($destAmountCurr);
		$destAmountSign = $currObj ? $currObj->sign : NULL;

		$exchSign = $destAmountSign."/".$srcAmountSign;
		$exchValue = 1;

		$rtSrcAmount = $this->currModel->format($tr["src_amount"], $srcAmountCurr);
		$rtDestAmount = $this->currModel->format($tr["dest_amount"], $destAmountCurr);
		$rtExchange = $exchValue." ".$exchSign;
		if ($tr["type"] != DEBT)
		{
			$rtSrcResBal = $src ? $this->currModel->format($src->balance, $src->curr) : NULL;
			$rtDestResBal = $dest ? $this->currModel->format($dest->balance, $dest->curr) : NULL;
		}
		else
		{
			$rtSrcResBal = $this->currModel->format(($give) ? $person_res_balance : $debtAcc->balance, $srcAmountCurr);
			$rtDestResBal = $this->currModel->format(($give) ? $debtAcc->balance : $person_res_balance, $destAmountCurr);
		}

		$dateFmt = date("d.m.Y");

		$titleString = "Jezve Money | ";
		if ($tr["type"] == DEBT)
			$headString = "New debt";
		else
			$headString = "New transaction";
		$titleString .= $headString;

		array_push($this->css->libs, "tiles.css", "iconlink.css", "ddlist.css", "calendar.css");
		$this->css->page[] = "transaction.css";
		$this->buildCSS();
		array_push($this->jsArr, "selection.js", "currency.js", "account.js", "person.js", "calendar.js", "ddlist.js", "tr_model.js", "tr_viewmodel.js");

		include("./view/templates/transaction.tpl");
	}


	public function update()
	{
		if ($_SERVER["REQUEST_METHOD"] == "POST")
		{
			$this->updateTransaction();
			return;
		}

		$action = "edit";

		$defMsg = ERR_TRANS_UPDATE;

		$trans_id = intval($this->actionParam);
		if (!$trans_id)
			$this->fail($defMsg);

		if (!$this->model->is_exist($trans_id))
			$this->fail($defMsg);

		$tr = $this->model->getProperties($trans_id);

		if ($tr["type"] == DEBT)
		{
			$debtMod = DebtModel::getInstance();
		}

		$acc_count = $this->accModel->getCount([ "full" => ($tr["type"] == DEBT) ]);

		if ($tr["type"] != DEBT)
		{
			// get information about source and destination accounts
			$src = $this->accModel->getProperties($tr["src_id"]);
			$dest = $this->accModel->getProperties($tr["dest_id"]);
		}

		// Prepare transaction types menu
		$trTypes = ["Expense", "Income", "Transfer", "Debt"];
		$transMenu = [];
		$baseUrl = BASEURL."transactions/new/";
		foreach($trTypes as $ind => $trTypeName)
		{
			$params = ["type" => strtolower($trTypeName)];

			$menuItem = new stdClass;
			$menuItem->ind = $ind + 1;
			$menuItem->title = $trTypeName;
			$menuItem->url = urlJoin($baseUrl, $params);

			$transMenu[] = $menuItem;
		}

		$formAction = BASEURL."transactions/".$action."/";

		$srcBalTitle = "Result balance";
		if ($tr["type"] == EXPENSE || $tr["type"] == TRANSFER)
		{
			if ($tr["type"] == TRANSFER)
				$srcBalTitle .= " (Source)";

			$balDiff = $tr["src_amount"];
			$src->balfmt = $this->currModel->format($src->balance + $balDiff, $src->curr);
		}

		$destBalTitle = "Result balance";
		if ($tr["type"] == INCOME || $tr["type"] == TRANSFER)
		{
			if ($tr["type"] == TRANSFER)
				$destBalTitle .= " (Destination)";

			$balDiff = $tr["dest_amount"];
			$dest->balfmt = $this->currModel->format($dest->balance - $balDiff, $dest->curr);
		}

		$transAcc_id = 0;		// main transaction account id
		$transAccCurr = 0;		// currency of transaction account

		if ($tr["type"] != DEBT)
		{
			if ((($tr["type"] == EXPENSE && $tr["dest_id"] == 0) || ($tr["type"] == TRANSFER && $tr["dest_id"] != 0)) && $tr["src_id"] != 0)
				$transAcc_id = $tr["src_id"];
			else if ($tr["type"] == INCOME && $tr["dest_id"] != 0 && $tr["src_id"] == 0)
				$transAcc_id = $tr["dest_id"];

			$accObj = $this->accModel->getItem($transAcc_id);
			$transAccCurr = ($accObj) ? $accObj->curr_id : NULL;

			$srcAmountCurr = $tr["src_curr"];
			$destAmountCurr = $tr["dest_curr"];

			if ($srcAmountCurr == $destAmountCurr)
			{
				if ($tr["type"] == EXPENSE)
				{
					$showSrcAmount = FALSE;
					$showDestAmount = TRUE;
				}
				else if ($tr["type"] == INCOME || $tr["type"] == TRANSFER)
				{
					$showSrcAmount = TRUE;
					$showDestAmount = FALSE;
				}
			}
			else
			{
				$showSrcAmount = TRUE;
				$showDestAmount = TRUE;
			}
		}
		else
		{
			// get information about source and destination accounts
			$src = $this->accModel->getProperties($tr["src_id"]);
			$dest = $this->accModel->getProperties($tr["dest_id"]);

			$uObj = $this->uMod->getItem($this->user_id);
			if (!$uObj)
				throw new Error("User not found");

			$give = (!is_null($src) && $src->owner != $uObj->owner_id);

			$srcBalTitle .= ($give) ? " (Person)" : " (Account)";
			$destBalTitle .= ($give) ? " (Account)" : " (Person)";

			$person_id = ($give) ? $src->owner : $dest->owner;
			$pObj = $this->personMod->getItem($person_id);
			if (!$pObj)
				throw new Error("Person not found");

			$person_name = $pObj->name;

			$person_acc_id = ($give) ? $tr["src_id"] : $tr["dest_id"];
			$person_acc = $this->accModel->getProperties($person_acc_id);
			$person_res_balance = $person_acc->balance;
			$person_balance = $person_res_balance + (($give) ? $tr["src_amount"] : -$tr["dest_amount"]);

			$debtAcc = $give ? $dest : $src;
			$noAccount = is_null($debtAcc);

			$srcAmountCurr = $tr["src_curr"];
			$destAmountCurr = $tr["dest_curr"];
			if ($noAccount)
			{
				$destAmountCurr = $person_acc->curr;

				$acc_id = $this->accModel->getIdByPos(0);
				$accObj = $this->accModel->getItem($acc_id);
				if (!$accObj)
					throw new Error("Account ".$acc_id." not found");

				$acc_name = $accObj->name;
				$acc_balance = $this->currModel->format($accObj->balance, $accObj->curr_id);
				$acc_ic = $this->accModel->getIconClass(($accObj) ? $accObj->icon : NULL);
			}
			else
			{
				$acc_id = 0;
			}

			$showSrcAmount = TRUE;
			$showDestAmount = FALSE;
		}


		// Common arrays
		$currArr = $this->currModel->getData();

		$accArr = $this->accModel->getData();
		if ($tr["type"] == DEBT)
			$persArr = $this->personMod->getData();

		$srcAmountLbl = ($showSrcAmount && $showDestAmount) ? "Source amount" : "Amount";
		$destAmountLbl = ($showSrcAmount && $showDestAmount) ? "Destination amount" : "Amount";

		if ($tr["type"] == DEBT)
		{
			if ($noAccount)
			{
				$accLbl = "No account";
			}
			else
			{
				if ($give)
					$accLbl = "Destination account";
				else
					$accLbl = "Source account";

				if ($give)
					$debtAcc->balfmt = $this->currModel->format($debtAcc->balance - $tr["dest_amount"], $debtAcc->curr);
				else
					$debtAcc->balfmt = $this->currModel->format($debtAcc->balance + $tr["src_amount"], $debtAcc->curr);
			}

			$p_balfmt = $this->currModel->format($person_balance, $srcAmountCurr);
		}

		$currObj = $this->currModel->getItem($srcAmountCurr);
		$srcAmountSign = $currObj ? $currObj->sign : NULL;

		$currObj = $this->currModel->getItem($destAmountCurr);
		$destAmountSign = $currObj ? $currObj->sign : NULL;

		$exchSign = $destAmountSign."/".$srcAmountSign;
		$exchValue = round($tr["dest_amount"] / $tr["src_amount"], 5);
		$backExchSign = $srcAmountSign."/".$destAmountSign;
		$backExchValue = round($tr["src_amount"] / $tr["dest_amount"], 5);

		$rtSrcAmount = $this->currModel->format($tr["src_amount"], $srcAmountCurr);
		$rtDestAmount = $this->currModel->format($tr["dest_amount"], $destAmountCurr);
		$rtExchange = $exchValue." ".$exchSign;
		if ($exchValue != 1)
			$rtExchange .= " (".$backExchValue." ".$backExchSign.")";
		if ($tr["type"] != DEBT)
		{
			$rtSrcResBal = ($src) ? $this->currModel->format($src->balance, $src->curr) : NULL;
			$rtDestResBal = ($dest) ? $this->currModel->format($dest->balance, $dest->curr) : NULL;
		}
		else
		{
			$acc_res_balance = ($debtAcc) ? $debtAcc->balance : NULL;
			$rtSrcResBal = $this->currModel->format(($give) ? $person_res_balance : $acc_res_balance, $srcAmountCurr);
			$rtDestResBal = $this->currModel->format(($give) ? $acc_res_balance : $person_res_balance, $destAmountCurr);
		}

		$dateFmt = date("d.m.Y", strtotime($tr["date"]));

		$titleString = "Jezve Money | ";
		if ($tr["type"] == DEBT)
			$headString = "Edit debt";
		else
			$headString = "Edit transaction";
		$titleString .= $headString;

		array_push($this->css->libs, "tiles.css", "iconlink.css", "ddlist.css", "calendar.css");
		$this->css->page[] = "transaction.css";
		$this->buildCSS();
		array_push($this->jsArr, "selection.js", "currency.js", "account.js", "person.js", "calendar.js", "ddlist.js", "tr_model.js", "tr_viewmodel.js");

		include("./view/templates/transaction.tpl");
	}


	public function createTransaction()
	{
		if (!isset($_GET["type"]))
			$this->fail();
		$trans_type = TransactionModel::getStringType($_GET["type"]);
		if (!$trans_type)
			$this->fail();

		$defMsg = ($trans_type == DEBT) ? ERR_DEBT_CREATE : ERR_TRANS_CREATE;

		if ($trans_type == DEBT)
		{
			$debt_op = (isset($_POST["debtop"])) ? intval($_POST["debtop"]) : 0;
			$person_id = (isset($_POST["person_id"])) ? intval($_POST["person_id"]) : 0;
			$acc_id = (isset($_POST["acc_id"])) ? intval($_POST["acc_id"]) : 0;

			if (($debt_op != 1 && $debt_op != 2) || !$person_id)
				$this->fail($defMsg);

			if (!$this->personMod->is_exist($person_id))		// person should exist
				$this->fail($defMsg);

			$debtMod = DebtModel::getInstance();
		}
		else
		{
			$src_id = (isset($_POST["src_id"])) ? intval($_POST["src_id"]) : 0;
			$dest_id = (isset($_POST["dest_id"])) ? intval($_POST["dest_id"]) : 0;
		}
		$src_amount = floatval($_POST["src_amount"]);
		$dest_amount = floatval($_POST["dest_amount"]);
		$src_curr = (isset($_POST["src_curr"])) ? intval($_POST["src_curr"]) : 0;
		$dest_curr = (isset($_POST["dest_curr"])) ? intval($_POST["dest_curr"]) : 0;
		$trdate = strtotime($_POST["date"]);
		$fdate = date("Y-m-d H:i:s", $trdate);
		$comment = $_POST["comm"];

		if ($src_amount == 0.0 || $dest_amount == 0.0 || $trdate == -1)
			$this->fail($defMsg);

		if ($trans_type == DEBT)
		{
			if (!$debtMod->create([ "op" => $debt_op,
									"acc_id" => $acc_id,
									"person_id" => $person_id,
									"src_amount" => $src_amount,
									"dest_amount" => $dest_amount,
									"src_curr" => $src_curr,
									"dest_curr" => $dest_curr,
									"date" => $fdate,
									"comment" => $comment ]))
				$this->fail($defMsg);

			setMessage(MSG_DEBT_CREATE);
		}
		else
		{
			if ($trans_type == EXPENSE && (!$src_id || !$src_curr || !$dest_curr))
				fail($defMsg);
			if ($trans_type == INCOME && (!$dest_id || !$src_curr || !$dest_curr))
				fail($defMsg);
			if ($trans_type == TRANSFER && (!$src_id || !$dest_id || !$src_curr || !$dest_id))
				fail($defMsg);

			// Check currency of account is the same as specified in transaction
			if ($trans_type == EXPENSE || $trans_type == TRANSFER)
			{
				$accObj = $this->accModel->getItem($src_id);
				$src_acc_curr = ($accObj) ? $accObj->curr_id : NULL;
				if ($src_acc_curr != $src_curr)
					fail($defMsg);
			}

			if ($trans_type == INCOME || $trans_type == TRANSFER)
			{
				$accObj = $this->accModel->getItem($dest_id);
				$dest_acc_curr = ($accObj) ? $accObj->curr_id : NULL;
				if ($dest_acc_curr != $dest_curr)
					fail($defMsg);
			}

			if (!$this->model->create([ "type" => $trans_type,
										"src_id" => $src_id,
										"dest_id" => $dest_id,
										"src_amount" => $src_amount,
										"dest_amount" => $dest_amount,
										"src_curr" => $src_curr,
										"dest_curr" => $dest_curr,
										"date" => $fdate,
										"comment" => $comment ]))
				$this->fail($defMsg);

			setMessage(MSG_TRANS_CREATE);
		}

		setLocation(BASEURL);
	}


	public function updateTransaction()
	{
		$trans_type = intval($_POST["transtype"]);

		$defMsg = ($trans_type == DEBT) ? ERR_DEBT_UPDATE : ERR_TRANS_UPDATE;

		if ($trans_type == DEBT)
		{
			$debt_op = (isset($_POST["debtop"])) ? intval($_POST["debtop"]) : 0;
			$person_id = (isset($_POST["person_id"])) ? intval($_POST["person_id"]) : 0;
			$acc_id = (isset($_POST["acc_id"])) ? intval($_POST["acc_id"]) : 0;

			if (($debt_op != 1 && $debt_op != 2) || !$person_id)
				$this->fail($defMsg);

			if (!$this->personMod->is_exist($person_id))		// person should exist
				$this->fail($defMsg);

			$debtMod = DebtModel::getInstance();
		}
		else
		{
			$src_id = (isset($_POST["src_id"])) ? intval($_POST["src_id"]) : 0;
			$dest_id = (isset($_POST["dest_id"])) ? intval($_POST["dest_id"]) : 0;
		}
		$src_amount = floatval($_POST["src_amount"]);
		$dest_amount = floatval($_POST["dest_amount"]);
		$src_curr = (isset($_POST["src_curr"])) ? intval($_POST["src_curr"]) : 0;
		$dest_curr = (isset($_POST["dest_curr"])) ? intval($_POST["dest_curr"]) : 0;
		$trdate = strtotime($_POST["date"]);
		$fdate = date("Y-m-d H:i:s", $trdate);
		$comment = $_POST["comm"];

		if ($src_amount == 0.0 || $dest_amount == 0.0 || $trdate == -1)
			$this->fail($defMsg);

		if (!isset($_POST["transid"]))
			$this->fail($defMsg);
		$trans_id = intval($_POST["transid"]);
		if ($trans_type == DEBT)
		{
			if (!$debtMod->update($trans_id, [ "op" => $debt_op,
												"acc_id" => $acc_id,
												"person_id" => $person_id,
												"src_amount" => $src_amount,
												"dest_amount" => $dest_amount,
												"src_curr" => $src_curr,
												"dest_curr" => $dest_curr,
												"date" => $fdate,
												"comment" => $comment ]))
				$this->fail($defMsg);
			setMessage(MSG_DEBT_UPDATE);
		}
		else
		{
			// Check currency of account is the same as specified in transaction
			if ($trans_type == EXPENSE || $trans_type == TRANSFER)
			{
				$accObj = $this->accModel->getItem($src_id);
				$src_acc_curr = ($accObj) ? $accObj->curr_id : NULL;
				if ($src_acc_curr != $src_curr)
					fail($defMsg);
			}

			if ($trans_type == INCOME || $trans_type == TRANSFER)
			{
				$accObj = $this->accModel->getItem($dest_id);
				$dest_acc_curr = ($accObj) ? $accObj->curr_id : NULL;
				if ($dest_acc_curr != $dest_curr)
					fail($defMsg);
			}

			if (!$this->model->update($trans_id, [ "type" => $trans_type,
												"src_id" => $src_id,
												"dest_id" => $dest_id,
												"src_amount" => $src_amount,
												"dest_amount" => $dest_amount,
												"src_curr" => $src_curr,
												"dest_curr" => $dest_curr,
												"date" => $fdate,
												"comment" => $comment ]))
				$this->fail($defMsg);
		}

		setMessage(MSG_TRANS_UPDATE);
		setLocation(BASEURL."transactions/");
	}


	public function del()
	{
		if ($_SERVER["REQUEST_METHOD"] != "POST")
			setLocation(BASEURL."transactions/");

		$defMsg = ERR_TRANS_DELETE;

		if (!isset($_POST["transactions"]))
			$this->fail($defMsg);

		$ids = explode(",", rawurldecode($_POST["transactions"]));
		if (!$this->model->del($ids))
			$this->fail();

		setMessage(MSG_TRANS_DELETE);
		setLocation(BASEURL."transactions/");
	}
}
