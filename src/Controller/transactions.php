<?php

class TransactionsController extends Controller
{
	public function __construct()
	{
		global $user_id;

		$this->accModel = new AccountModel($user_id);
	}


	public function index()
	{
		global $user_id, $user_name, $uMod;

		$transMod = new TransactionModel($user_id);
		$currMod = new CurrencyModel();
		$filterObj = new stdClass;


		$type_str = (isset($_GET["type"])) ? $_GET["type"] : "all";

		$trans_type = TransactionModel::getStringType($type_str);
		if (is_null($trans_type))
			$this->fail();

		$page_num = (isset($_GET["page"]) && is_numeric($_GET["page"])) ? (intval($_GET["page"]) - 1) : 0;

		// Prepare array of accounts
		$accFilter = [];
		if (isset($_GET["acc_id"]))
		{
			$accExpl = explode(",", $_GET["acc_id"]);
			foreach($accExpl as $acc_id)
			{
				$acc_id = intval(trim($acc_id));
				if ($acc_id && $this->accModel->is_exist($acc_id))
					$accFilter[] = $acc_id;
			}
		}

		$filterObj->acc_id = $accFilter;
		$filterObj->type = $type_str;

		$searchReq = (isset($_GET["search"]) ? $_GET["search"] : NULL);
		if (!is_null($searchReq))
			$filterObj->search = $searchReq;

		$stDate = (isset($_GET["stdate"]) ? $_GET["stdate"] : NULL);
		$endDate = (isset($_GET["enddate"]) ? $_GET["enddate"] : NULL);

		$dateFmt = "";
		if (!is_null($stDate) && !is_null($endDate))
		{
			$sdate = strtotime($stDate);
			$edate = strtotime($endDate);
			if ($sdate != -1 && $edate != -1)
				$dateFmt = date("d.m.Y", $sdate)." - ".date("d.m.Y", $edate);

			$filterObj->stdate = $stDate;
			$filterObj->enddate = $endDate;
		}

		$showDetails = FALSE;
		if (isset($_GET["mode"]) && $_GET["mode"] == "details")
		{
			$showDetails = TRUE;
			$filterObj->mode = "details";
		}

		$accArr = $this->accModel->getArray();
		$accounts = $this->accModel->getCount();

		$tr_on_page = 20;

		$totalTrCount = $transMod->getCount();
		$transArr = ($totalTrCount) ? $transMod->getArray($trans_type, $accFilter, TRUE, $tr_on_page, $page_num, $searchReq, $stDate, $endDate, TRUE) : [];
		$transCount = $transMod->getTransCount($trans_type, $accFilter, $searchReq, $stDate, $endDate);

		$currArr = $currMod->getArray();

		// Prepare transaction types menu
		$trTypes = ["All", "Expense", "Income", "Transfer", "Debt"];
		$transMenu = [];
		$baseUrl = BASEURL."transactions/";
		foreach($trTypes as $ind => $trTypeName)
		{
			$params = ["type" => strtolower($trTypeName)];
			if (count($filterObj->acc_id) > 0)
				$params["acc_id"] = implode(",", $filterObj->acc_id);
			if ($showDetails)
				$params["mode"] = "details";
			if (!is_empty($searchReq))
				$params["search"] = $searchReq;
			if (!is_empty($stDate) && !is_empty($endDate))
			{
				$params["stdate"] = $stDate;
				$params["enddate"] = $endDate;
			}

			$transMenu[] = [$ind, $trTypeName, urlJoin($baseUrl, $params)];
		}

		$showPaginator = TRUE;
		$details = $showDetails;

		// Prepare mode selector and paginator
		if ($showPaginator == TRUE)
		{
			// Prepare classic/details mode link
			$params = ["type" => $transMod->getTypeString($trans_type),
							"mode" => (($details) ? "classic" : "details")];
			if (count($filterObj->acc_id) > 0)
				$params["acc_id"] = implode(",", $filterObj->acc_id);
			if ($page_num != 0)
				$params["page"] = ($page_num + 1);
			if (!is_empty($searchReq))
				$params["search"] = $searchReq;
			if (!is_empty($stDate) && !is_empty($endDate))
			{
				$params["stdate"] = $stDate;
				$params["enddate"] = $endDate;
			}
			$linkStr = urlJoin(BASEURL."transactions/", $params);

			// Build data for paginator
			if ($tr_on_page > 0)
			{
				$pageCount = ceil($transCount / $tr_on_page);
				$pagesArr = ($transCount > $tr_on_page) ? $transMod->getPaginatorArray($page_num, $pageCount) : [];
				foreach($pagesArr as $ind => $pageItem)
				{
					if (is_numeric($pageItem["text"]) && !$pageItem["active"])
					{
						$pNum = intval($pageItem["text"]);
						$pagesArr[$ind]["link"] = $transMod->getPageLink($trans_type, $filterObj->acc_id, $pNum, $searchReq, $stDate, $endDate, $details);
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
					$itemData["balance"][] = $currMod->format($trans->src_balance, $trans->src_curr);
				}

				if ($trans->dest_id != 0)
				{
					$itemData["balance"][] = $currMod->format($trans->dest_balance, $trans->dest_curr);
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
		global $user_id, $user_name, $uMod;

		if ($_SERVER["REQUEST_METHOD"] == "POST")
		{
			$this->createTransaction();
			return;
		}

		$action = "new";

		$defMsg = ERR_TRANS_CREATE;

		$transMod = new TransactionModel($user_id);
		$currMod = new CurrencyModel();

		// check predefined type of transaction
		$type_str = (isset($_GET["type"])) ? $_GET["type"] : "expense";
		$trans_type = TransactionModel::getStringType($type_str);
		if (!$trans_type)
		{
			$type_str = "expense";
			$trans_type = TransactionModel::getStringType($type_str);
		}
		if (!$trans_type)
			$this->fail($defMsg);

		// check predefined account
		$acc_id = 0;
		if (isset($_GET["acc_id"]))
			$acc_id = intval($_GET["acc_id"]);
		if (!$acc_id || !$this->accModel->is_exist($acc_id))		// TODO : think about redirect or warning message
			$acc_id = $this->accModel->getIdByPos(0);
		if (!$acc_id)
			$this->fail($defMsg);

		if ($trans_type == DEBT)
		{
			$debtMod = new DebtModel($user_id);
			$pMod = new PersonModel($user_id);

			$debtAcc = $this->accModel->getProperties($acc_id);

			// Prepare person account
			$person_id = $pMod->getIdByPos(0);
			$pObj = $pMod->getItem($person_id);
			if (!$pObj)
				throw new Error("Person not found");

			$person_name = $pObj->name;

			$person_acc_id = $pMod->getAccount($person_id, $debtAcc->curr);
			$person_acc = $this->accModel->getProperties($person_acc_id);
			$person_res_balance = ($person_acc) ? $person_acc->balance : 0.0;
			$person_balance = $person_res_balance;

			$tr = [ "src_id" => $person_acc_id,
					"dest_id" => $acc_id,
					"src_amount" => 0,
					"dest_amount" => 0,
					"src_curr" => $debtAcc->curr,
					"dest_curr" => $debtAcc->curr,
					"type" => $trans_type,
					"comment" => "" ];
			$give = TRUE;
		}
		else
		{
			// set source and destination accounts
			$src_id = 0;
			$dest_id = 0;
			if ($trans_type == EXPENSE || $trans_type == TRANSFER)
				$src_id = ($acc_id ? $acc_id : $this->accModel->getIdByPos(0));
			else if ($trans_type == INCOME)		// income
				$dest_id = ($acc_id ? $acc_id : $this->accModel->getIdByPos(0));

			if ($trans_type == TRANSFER)
				$dest_id = $this->accModel->getAnother($src_id);

			$tr = ["src_id" => $src_id,
						"dest_id" => $dest_id,
						"src_amount" => 0,
						"dest_amount" => 0,
						"src_curr" => 0,
						"dest_curr" => 0,
						"type" => $trans_type,
						"comment" => ""];

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

			if ($trans_type == EXPENSE)
				$tr["dest_curr"] = $tr["src_curr"];
			else if ($trans_type == INCOME)
				$tr["src_curr"] = $tr["dest_curr"];
		}

		$acc_count = $this->accModel->getCount();

		if ($trans_type != DEBT)
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

			$transMenu[] = [($ind + 1), $trTypeName, urlJoin($baseUrl, $params)];
		}

		$formAction = BASEURL."transactions/".$action."/?type=".$type_str;

		if ($trans_type == EXPENSE || $trans_type == TRANSFER || $trans_type == DEBT)
		{
			$srcBalTitle = "Result balance";
			if ($trans_type == TRANSFER)
				$srcBalTitle .= " (Source)";
			else if ($trans_type == DEBT)
				$srcBalTitle .= ($give) ? " (Person)" : " (Account)";

			$balDiff = $tr["src_amount"];
			if ($trans_type != DEBT)
				$src->balfmt = $currMod->format($src->balance + $balDiff, $src->curr);
		}

		if ($trans_type == INCOME || $trans_type == TRANSFER || $trans_type == DEBT)
		{
			$destBalTitle = "Result balance";
			if ($trans_type == TRANSFER)
				$destBalTitle .= " (Destination)";
			else if ($trans_type == DEBT)
				$destBalTitle .= ($give) ? " (Account)" : " (Person)";

			$balDiff = $tr["dest_amount"];
			if ($trans_type != DEBT)
				$dest->balfmt = $currMod->format($dest->balance - $balDiff, $dest->curr);
		}

		$transAcc_id = 0;		// main transaction account id
		$transAccCurr = 0;		// currency of transaction account

		if ($trans_type != DEBT)
		{
			$transCurr = (($trans_type == EXPENSE) ? $src->curr : $dest->curr);
			$transAccCurr = (($trans_type == EXPENSE) ? $src->curr : $dest->curr);

			$srcAmountCurr = (!is_null($src)) ? $src->curr : $dest->curr;
			$destAmountCurr = (!is_null($dest)) ? $dest->curr : $src->curr;

			// Show destination amount for expense and source amount for income by default because it's amount with changing currency.
			// Meanwhile source amount for expense and destination amount for income always have the same currency as account.
			$showSrcAmount = ($trans_type != EXPENSE);
			if ($trans_type == TRANSFER)
				$showDestAmount = ($srcAmountCurr != $destAmountCurr);
			else
				$showDestAmount = ($trans_type != INCOME);
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
		$currArr = $currMod->getArray();

		$accArr = $this->accModel->getArray();
		if ($trans_type == DEBT)
			$persArr = $pMod->getArray();

		$srcAmountLbl = ($showSrcAmount && $showDestAmount) ? "Source amount" : "Amount";
		$destAmountLbl = ($showSrcAmount && $showDestAmount) ? "Destination amount" : "Amount";

		if ($trans_type == DEBT)
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

			$debtAcc->balfmt = $currMod->format($debtAcc->balance + $tr["dest_amount"], $debtAcc->curr);

			$p_balfmt = $currMod->format($person_balance, $srcAmountCurr);
		}

		$currObj = $currMod->getItem($srcAmountCurr);
		$srcAmountSign = $currObj ? $currObj->sign : NULL;

		$currObj = $currMod->getItem($destAmountCurr);
		$destAmountSign = $currObj ? $currObj->sign : NULL;

		$exchSign = $destAmountSign."/".$srcAmountSign;
		$exchValue = 1;

		$rtSrcAmount = $currMod->format($tr["src_amount"], $srcAmountCurr);
		$rtDestAmount = $currMod->format($tr["dest_amount"], $destAmountCurr);
		$rtExchange = $exchValue." ".$exchSign;
		if ($trans_type != DEBT)
		{
			$rtSrcResBal = $src ? $currMod->format($src->balance, $src->curr) : NULL;
			$rtDestResBal = $dest ? $currMod->format($dest->balance, $dest->curr) : NULL;
		}
		else
		{
			$rtSrcResBal = $currMod->format(($give) ? $person_res_balance : $debtAcc->balance, $srcAmountCurr);
			$rtDestResBal = $currMod->format(($give) ? $debtAcc->balance : $person_res_balance, $destAmountCurr);
		}

		$dateFmt = date("d.m.Y");

		$titleString = "Jezve Money | ";
		if ($trans_type == DEBT)
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
		global $uMod, $user_id, $user_name;

		if ($_SERVER["REQUEST_METHOD"] == "POST")
		{
			$this->updateTransaction();
			return;
		}

		$action = "edit";

		$defMsg = ERR_TRANS_UPDATE;

		$transMod = new TransactionModel($user_id);
		$currMod = new CurrencyModel();

		$trans_id = intval($this->actionParam);
		if (!$trans_id)
			$this->fail($defMsg);

		if (!$transMod->is_exist($trans_id))
			$this->fail($defMsg);

		$tr = $transMod->getProperties($trans_id);
		$trans_type = $tr["type"];			// TODO : temporarily

		if ($trans_type == DEBT)
		{
			$debtMod = new DebtModel($user_id);
			$pMod = new PersonModel($user_id);
		}

		$acc_count = $this->accModel->getCount([ "full" => ($trans_type == DEBT) ]);

		if ($trans_type != DEBT)
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

			$transMenu[] = [($ind + 1), $trTypeName, urlJoin($baseUrl, $params)];
		}

		$formAction = BASEURL."transactions/".$action."/";

		$srcBalTitle = "Result balance";
		if ($trans_type == EXPENSE || $trans_type == TRANSFER)
		{
			if ($trans_type == TRANSFER)
				$srcBalTitle .= " (Source)";

			$balDiff = $tr["src_amount"];
			$src->balfmt = $currMod->format($src->balance + $balDiff, $src->curr);
		}

		$destBalTitle = "Result balance";
		if ($trans_type == INCOME || $trans_type == TRANSFER)
		{
			if ($trans_type == TRANSFER)
				$destBalTitle .= " (Destination)";

			$balDiff = $tr["dest_amount"];
			$dest->balfmt = $currMod->format($dest->balance - $balDiff, $dest->curr);
		}

		$transAcc_id = 0;		// main transaction account id
		$transAccCurr = 0;		// currency of transaction account

		if ($trans_type != DEBT)
		{
			if ((($trans_type == EXPENSE && $tr["dest_id"] == 0) || ($trans_type == TRANSFER && $tr["dest_id"] != 0)) && $tr["src_id"] != 0)
				$transAcc_id = $tr["src_id"];
			else if ($trans_type == INCOME && $tr["dest_id"] != 0 && $tr["src_id"] == 0)
				$transAcc_id = $tr["dest_id"];

			$accObj = $this->accModel->getItem($transAcc_id);
			$transAccCurr = ($accObj) ? $accObj->curr_id : NULL;

			$srcAmountCurr = $tr["src_curr"];
			$destAmountCurr = $tr["dest_curr"];

			if ($srcAmountCurr == $destAmountCurr)
			{
				if ($trans_type == EXPENSE)
				{
					$showSrcAmount = FALSE;
					$showDestAmount = TRUE;
				}
				else if ($trans_type == INCOME || $trans_type == TRANSFER)
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

			$uObj = $uMod->getItem($user_id);
			if (!$uObj)
				throw new Error("User not found");

			$give = (!is_null($src) && $src->owner != $uObj->owner_id);

			$srcBalTitle .= ($give) ? " (Person)" : " (Account)";
			$destBalTitle .= ($give) ? " (Account)" : " (Person)";

			$person_id = ($give) ? $src->owner : $dest->owner;
			$pObj = $pMod->getItem($person_id);
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
				$acc_balance = $currMod->format($accObj->balance, $accObj->curr_id);
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
		$currArr = $currMod->getArray();

		$accArr = $this->accModel->getArray();
		if ($trans_type == DEBT)
			$persArr = $pMod->getArray();

		$srcAmountLbl = ($showSrcAmount && $showDestAmount) ? "Source amount" : "Amount";
		$destAmountLbl = ($showSrcAmount && $showDestAmount) ? "Destination amount" : "Amount";

		if ($trans_type == DEBT)
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
					$debtAcc->balfmt = $currMod->format($debtAcc->balance - $tr["dest_amount"], $debtAcc->curr);
				else
					$debtAcc->balfmt = $currMod->format($debtAcc->balance + $tr["src_amount"], $debtAcc->curr);
			}

			$p_balfmt = $currMod->format($person_balance, $srcAmountCurr);
		}

		$currObj = $currMod->getItem($srcAmountCurr);
		$srcAmountSign = $currObj ? $currObj->sign : NULL;

		$currObj = $currMod->getItem($destAmountCurr);
		$destAmountSign = $currObj ? $currObj->sign : NULL;

		$exchSign = $destAmountSign."/".$srcAmountSign;
		$exchValue = round($tr["dest_amount"] / $tr["src_amount"], 5);
		$backExchSign = $srcAmountSign."/".$destAmountSign;
		$backExchValue = round(1 / $exchValue, 5);

		$rtSrcAmount = $currMod->format($tr["src_amount"], $srcAmountCurr);
		$rtDestAmount = $currMod->format($tr["dest_amount"], $destAmountCurr);
		$rtExchange = $exchValue." ".$exchSign;
		if ($exchValue != 1)
			$rtExchange .= " (".$backExchValue." ".$backExchSign.")";
		if ($trans_type != DEBT)
		{
			$rtSrcResBal = ($src) ? $currMod->format($src->balance, $src->curr) : NULL;
			$rtDestResBal = ($dest) ? $currMod->format($dest->balance, $dest->curr) : NULL;
		}
		else
		{
			$acc_res_balance = ($debtAcc) ? $debtAcc->balance : NULL;
			$rtSrcResBal = $currMod->format(($give) ? $person_res_balance : $acc_res_balance, $srcAmountCurr);
			$rtDestResBal = $currMod->format(($give) ? $acc_res_balance : $person_res_balance, $destAmountCurr);
		}

		$dateFmt = date("d.m.Y", strtotime($tr["date"]));

		$titleString = "Jezve Money | ";
		if ($trans_type == DEBT)
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
		global $user_id;

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

			$persMod = new PersonModel($user_id);
			if (!$persMod->is_exist($person_id))		// person should exist
				$this->fail($defMsg);

			$debtMod = new DebtModel($user_id);
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

		$transMod = new TransactionModel($user_id);

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

			if (!$transMod->create([ "type" => $trans_type,
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
		global $user_id;

		$trans_type = intval($_POST["transtype"]);

		$defMsg = ($trans_type == DEBT) ? ERR_DEBT_UPDATE : ERR_TRANS_UPDATE;

		if ($trans_type == DEBT)
		{
			$debt_op = (isset($_POST["debtop"])) ? intval($_POST["debtop"]) : 0;
			$person_id = (isset($_POST["person_id"])) ? intval($_POST["person_id"]) : 0;
			$acc_id = (isset($_POST["acc_id"])) ? intval($_POST["acc_id"]) : 0;

			if (($debt_op != 1 && $debt_op != 2) || !$person_id)
				$this->fail($defMsg);

			$persMod = new PersonModel($user_id);
			if (!$persMod->is_exist($person_id))		// person should exist
				$this->fail($defMsg);

			$debtMod = new DebtModel($user_id);
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

		$transMod = new TransactionModel($user_id);

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

			if (!$transMod->update($trans_id, [ "type" => $trans_type,
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
		global $user_id;

		if ($_SERVER["REQUEST_METHOD"] != "POST")
			setLocation(BASEURL."transactions/");

		$defMsg = ERR_TRANS_DELETE;

		$transMod = new TransactionModel($user_id);

		if (!isset($_POST["transactions"]))
			$this->fail($defMsg);
		$trans_arr = explode(",", $_POST["transactions"]);
		foreach($trans_arr as $trans_id)
		{
			$trans_id = intval($trans_id);
			if (!$transMod->del($trans_id))
				$this->fail();
		}

		setMessage(MSG_TRANS_DELETE);
		setLocation(BASEURL."transactions/");
	}
}
