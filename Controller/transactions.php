<?php

class TransactionsController extends Controller
{
	public function index()
	{
		global $u, $user_id, $user_name;

		$trans = new Transaction($user_id);
		$acc = new Account($user_id);
		$filterObj = new stdClass;


		$type_str = (isset($_GET["type"])) ? $_GET["type"] : "all";

		$trans_type = Transaction::getStringType($type_str);
		if (is_null($trans_type))
			$this->fail();

		$page_num = (isset($_GET["page"]) && is_numeric($_GET["page"])) ? (intval($_GET["page"]) - 1) : 0;

		// Prepare array of accounts
		$accFilter = array();
		if (isset($_GET["acc_id"]))
		{
			$accExpl = explode(",", $_GET["acc_id"]);
			foreach($accExpl as $acc_id)
			{
				$acc_id = intval(trim($acc_id));
				if ($acc_id && $acc->is_exist($acc_id))
					$accFilter[] = $acc_id;
			}
		}

		$filterObj->acc_id = $accFilter;

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

		$accArr = $acc->getArray();

		$acc = new Account($user_id, TRUE);
		$accounts = $acc->getCount();

		$tr_on_page = 10;

		$totalTrCount = $trans->getCount();
		$transArr = ($totalTrCount) ? $trans->getArray($trans_type, $accFilter, TRUE, $tr_on_page, $page_num, $searchReq, $stDate, $endDate, TRUE) : array();
		$transCount = $trans->getTransCount($trans_type, $accFilter, $searchStr, $startDate, $endDate);

		$currArr = Currency::getArray();

		// Prepare transaction types menu
		$trTypes = array("All", "Expense", "Income", "Transfer", "Debt");
		$transMenu = array();
		$baseUrl = BASEURL."transactions/";
		foreach($trTypes as $ind => $trTypeName)
		{
			$params = array("type" => strtolower($trTypeName));
			if ($acc_id != 0)
				$params["acc_id"] = $acc_id;
			if ($showDetails)
				$params["mode"] = "details";

			$transMenu[] = array($ind, $trTypeName, urlJoin($baseUrl, $params));
		}

		$showPaginator = TRUE;
		$details = $showDetails;

		// Prepare mode selector and paginator
		if ($showPaginator == TRUE)
		{
			$params = array("type" => $trans->getTypeString($trans_type),
							"mode" => (($details) ? "classic" : "details"));
			if ($acc_id != 0)
				$params["acc_id"] = $acc_id;
			if ($page_num != 0)
				$params["page"] = ($page_num + 1);
			if (!is_empty($searchStr))
				$params["search"] = $searchStr;
			if (!is_empty($startDate) && !is_empty($endDate))
			{
				$params["stdate"] = $startDate;
				$params["enddate"] = $endDate;
			}
			$linkStr = urlJoin(BASEURL."transactions/", $params);

			// Build data for paginator
			if ($tr_on_page > 0)
			{
				$pageCount = ceil($transCount / $tr_on_page);
				$pagesArr = ($transCount > $tr_on_page) ? $trans->getPaginatorArray($page_num, $pageCount) : array();
				foreach($pagesArr as $ind => $pageItem)
				{
					if (is_numeric($pageItem["text"]) && !$pageItem["active"])
					{
						$pNum = intval($pageItem["text"]);
						$pagesArr[$ind]["link"] = $trans->getPageLink($trans_type, $acc_id, $pNum, $searchStr, $startDate, $endDate, $details);
					}
				}
			}
		}

		// Prepare data of transaction list items
		$trListData = array();
		foreach($transArr as $trans)
		{
			if ($trans->type == 4)
			{
				$src_owner_id = $acc->getOwner($trans->src_id);
				$dest_owner_id = $acc->getOwner($trans->dest_id);
			}

			$itemData = array("id" => $trans->id);

			// Build accounts string
			$accStr = "";
			if ($trans->src_id != 0)
			{
				if ($trans->type == 1 || $trans->type == 3)		// expense or transfer
					$accStr .= $acc->getName($trans->src_id);
				else if ($trans->type == 4)
					$accStr .= $acc->getNameOrPerson($trans->src_id);
			}

			if ($trans->src_id != 0 && $trans->dest_id != 0 && ($trans->type == 3 || $trans->type == 4))
				$accStr .= " → ";

			if ($trans->dest_id != 0)
			{
				if ($trans->type == 2 || $trans->type == 3)		// income or transfer
					$accStr .= $acc->getName($trans->dest_id);
				else if ($trans->type == 4)
					$accStr .= $acc->getNameOrPerson($trans->dest_id);
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
				$itemData["balance"] = array();

				if ($trans->src_id != 0)
				{
					$itemData["balance"][] = Currency::format($trans->src_balance, $trans->src_curr);
				}

				if ($trans->dest_id != 0)
				{
					$itemData["balance"][] = Currency::format($trans->dest_balance, $trans->dest_curr);
				}
			}


			$trListData[] = $itemData;
		}

		$titleString = "Jezve Money | Transactions";

		$cssArr = array("common.css", "tiles.css", "iconlink.css", "popup.css", "calendar.css", "ddlist.css", "transaction.css", "trlist.css", "toolbar.css");
		$jsArr = array("es5-shim.min.js", "common.js", "app.js", "selection.js", "currency.js", "account.js", "ajax.js", "calendar.js", "popup.js", "dragndrop.js", "sortable.js", "toolbar.js", "ddlist.js", "tr_list.js");

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
		global $u, $user_id, $user_name;

		if ($_SERVER["REQUEST_METHOD"] == "POST")
		{
			$this->createTransaction();
			return;
		}

		$action = "new";

		$defMsg = ERR_TRANS_CREATE;

		$trans = new Transaction($user_id);

		// check predefined type of transaction
		$type_str = (isset($_GET["type"])) ? $_GET["type"] : "expense";
		$trans_type = Transaction::getStringType($type_str);
		if (!$trans_type)
		{
			$type_str = "expense";
			$trans_type = Transaction::getStringType($type_str);
		}
		if (!$trans_type)
			$this->fail($defMsg);

		$acc = new Account($user_id);

		// check predefined account
		$acc_id = 0;
		if (isset($_GET["acc_id"]))
			$acc_id = intval($_GET["acc_id"]);
		if (!$acc_id || !$acc->is_exist($acc_id))		// TODO : think about redirect or warning message
			$acc_id = $acc->getIdByPos(0);
		if (!$acc_id)
			$this->fail($defMsg);

		if ($trans_type == DEBT)
		{
			$debt = new Debt($user_id);
			$person = new Person($user_id);

			$debtAcc = $acc->getProperties($acc_id);

			// Prepare person account
			$person_id = $person->getIdByPos(0);
			$person_name = $person->getName($person_id);

			$acc = new Account($user_id, TRUE);
			$person_acc_id = $person->getAccount($person_id, $debtAcc["curr"]);
			$person_acc = $acc->getProperties($person_acc_id);
			$person_res_balance = $person_acc ? $person_acc["balance"] : 0.0;
			$person_balance = $person_res_balance;

			$tr = array("src_id" => $person_acc_id, "dest_id" => $acc_id, "src_amount" => 0, "dest_amount" => 0, "src_curr" => $debtAcc["curr"], "dest_curr" => $debtAcc["curr"], "type" => $trans_type, "comment" => "");
			$give = TRUE;
		}
		else
		{
			// set source and destination accounts
			$src_id = 0;
			$dest_id = 0;
			if ($trans_type == EXPENSE || $trans_type == TRANSFER)
				$src_id = ($acc_id ? $acc_id : $acc->getIdByPos(0));
			else if ($trans_type == INCOME)		// income
				$dest_id = ($acc_id ? $acc_id : $acc->getIdByPos(0));

			if ($trans_type == TRANSFER)
				$dest_id = $acc->getAnother($src_id);

			$tr = array("src_id" => $src_id,
						"dest_id" => $dest_id,
						"src_amount" => 0,
						"dest_amount" => 0,
						"src_curr" => ($src_id != 0) ? $acc->getCurrency($src_id) : 0,
						"dest_curr" => ($dest_id != 0) ? $acc->getCurrency($dest_id) : 0,
						"type" => $trans_type,
						"comment" => "");

			if ($trans_type == EXPENSE)
				$tr["dest_curr"] = $tr["src_curr"];
			else if ($trans_type == INCOME)
				$tr["src_curr"] = $tr["dest_curr"];
		}

		$acc_count = $acc->getCount();

		if ($trans_type != DEBT)
		{
			// get information about source and destination accounts
			$src = $acc->getProperties($tr["src_id"]);
			$dest = $acc->getProperties($tr["dest_id"]);
		}

		// Prepare transaction types menu
		$trTypes = array("Expense", "Income", "Transfer", "Debt");
		$transMenu = array();
		$baseUrl = BASEURL."transactions/new/";
		foreach($trTypes as $ind => $trTypeName)
		{
			$params = array("type" => strtolower($trTypeName));
			if ($acc_id != 0)
				$params["acc_id"] = $acc_id;

			$transMenu[] = array(($ind + 1), $trTypeName, urlJoin($baseUrl, $params));
		}

		$formAction = BASEURL."transactions/".$action."/?type=".$type_str;

		if ($trans_type == EXPENSE || $trans_type == TRANSFER || $trans_type == DEBT)
		{
			$srcBalTitle = "Result balance";
			if ($trans_type == TRANSFER)
				$srcBalTitle .= " (Source)";
			else if ($trans_type == DEBT)
				$srcBalTitle .= " (Person)";

			$balDiff = $tr["src_amount"];
			$src["balfmt"] = Currency::format($src["balance"] + $balDiff, $src["curr"]);
		}

		if ($trans_type == INCOME || $trans_type == TRANSFER || $trans_type == DEBT)
		{
			$destBalTitle = "Result balance";
			if ($trans_type == TRANSFER)
				$destBalTitle .= " (Destination)";
			else if ($trans_type == DEBT)
				$destBalTitle .= " (Account)";

			$balDiff = $tr["dest_amount"];
			$dest["balfmt"] = Currency::format($dest["balance"] - $balDiff, $dest["curr"]);
		}

		$transAcc_id = 0;		// main transaction account id
		$transAccCurr = 0;		// currency of transaction account

		if ($trans_type != DEBT)
		{
			$transCurr = (($trans_type == EXPENSE) ? $src["curr"] : $dest["curr"]);
			$transAccCurr = (($trans_type == EXPENSE) ? $src["curr"] : $dest["curr"]);

			$srcAmountCurr = (!is_null($src)) ? $src["curr"] : $dest["curr"];
			$destAmountCurr = (!is_null($dest)) ? $dest["curr"] : $src["curr"];

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

			$srcAmountCurr = $debtAcc["curr"];
			$destAmountCurr = $debtAcc["curr"];

			$showSrcAmount = TRUE;
			$showDestAmount = FALSE;
		}

		// Common arrays
		$currArr = Currency::getArray();
		$acc = new Account($user_id);
		$accArr = $acc->getArray();
		if ($trans_type == DEBT)
			$persArr = $person->getArray();

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

			$debtAcc["balfmt"] = Currency::format($debtAcc["balance"] + $tr["dest_amount"], $debtAcc["curr"]);

			$p_balfmt = Currency::format($person_balance, $srcAmountCurr);
		}

		$srcAmountSign = Currency::getSign($srcAmountCurr);
		$destAmountSign = Currency::getSign($destAmountCurr);
		$exchSign = $destAmountSign."/".$srcAmountSign;
		$exchValue = 1;

		$rtSrcAmount = Currency::format($tr["src_amount"], $srcAmountCurr);
		$rtDestAmount = Currency::format($tr["dest_amount"], $destAmountCurr);
		$rtExchange = $exchValue." ".$exchSign;
		if ($trans_type != DEBT)
		{
			$rtSrcResBal = Currency::format($src["balance"], $src["curr"]);
			$rtDestResBal = Currency::format($dest["balance"], $dest["curr"]);
		}
		else
		{
			$rtSrcResBal = Currency::format($person_res_balance, $srcAmountCurr);
			$rtDestResBal = Currency::format($debtAcc["balance"], $debtAcc["curr"]);
		}

		$dateFmt = date("d.m.Y");

		$titleString = "Jezve Money | ";
		if ($trans_type == DEBT)
			$headString = "New debt";
		else
			$headString = "New transaction";
		$titleString .= $headString;

		$cssArr = array("common.css", "transaction.css", "tiles.css", "iconlink.css", "ddlist.css", "calendar.css");
		$jsArr = array("es5-shim.min.js", "common.js", "app.js", "selection.js", "currency.js", "account.js", "person.js", "calendar.js", "ddlist.js", "tr_model.js", "tr_viewmodel.js");

		include("./view/templates/transaction.tpl");
	}


	public function update()
	{
		global $u, $user_id, $user_name;

		if ($_SERVER["REQUEST_METHOD"] == "POST")
		{
			$this->updateTransaction();
			return;
		}

		$action = "edit";

		$defMsg = ERR_TRANS_UPDATE;

		$trans = new Transaction($user_id);

		$trans_id = intval($this->actionParam);
		if (!$trans_id)
			$this->fail($defMsg);

		if (!$trans->is_exist($trans_id))
			$this->fail($defMsg);

		$tr = $trans->getProperties($trans_id);
		$trans_type = $tr["type"];			// TODO : temporarily

		$acc = new Account($user_id, ($trans_type == DEBT));
		if ($trans_type == DEBT)
		{
			$debt = new Debt($user_id);
			$person = new Person($user_id);
		}

		$acc_count = $acc->getCount();

		if ($trans_type != DEBT)
		{
			// get information about source and destination accounts
			$src = $acc->getProperties($tr["src_id"]);
			$dest = $acc->getProperties($tr["dest_id"]);
		}

		// Prepare transaction types menu
		$trTypes = array("Expense", "Income", "Transfer", "Debt");
		$transMenu = array();
		$baseUrl = BASEURL."transactions/new/";
		foreach($trTypes as $ind => $trTypeName)
		{
			$params = array("type" => strtolower($trTypeName));
			if ($acc_id != 0)
				$params["acc_id"] = $acc_id;

			$transMenu[] = array(($ind + 1), $trTypeName, urlJoin($baseUrl, $params));
		}

		$formAction = BASEURL."transactions/".$action."/";

		if ($trans_type == EXPENSE || $trans_type == TRANSFER || $trans_type == DEBT)
		{
			$srcBalTitle = "Result balance";
			if ($trans_type == TRANSFER)
				$srcBalTitle .= " (Source)";
			else if ($trans_type == DEBT)
				$srcBalTitle .= " (Person)";

			$balDiff = $tr["src_amount"];
			$src["balfmt"] = Currency::format($src["balance"] + $balDiff, $src["curr"]);
		}

		if ($trans_type == INCOME || $trans_type == TRANSFER || $trans_type == DEBT)
		{
			$destBalTitle = "Result balance";
			if ($trans_type == TRANSFER)
				$destBalTitle .= " (Destination)";
			else if ($trans_type == DEBT)
				$destBalTitle .= " (Account)";

			$balDiff = $tr["dest_amount"];
			$dest["balfmt"] = Currency::format($dest["balance"] - $balDiff, $dest["curr"]);
		}

		$transAcc_id = 0;		// main transaction account id
		$transAccCurr = 0;		// currency of transaction account

		if ($trans_type != DEBT)
		{
			if ((($trans_type == EXPENSE && $tr["dest_id"] == 0) || ($trans_type == TRANSFER && $tr["dest_id"] != 0)) && $tr["src_id"] != 0)
				$transAcc_id = $tr["src_id"];
			else if ($trans_type == INCOME && $tr["dest_id"] != 0 && $tr["src_id"] == 0)
				$transAcc_id = $tr["dest_id"];

			$transAccCurr = $acc->getCurrency($transAcc_id);

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
			$src = $acc->getProperties($tr["src_id"]);
			$dest = $acc->getProperties($tr["dest_id"]);

			$user_owner = $u->getOwner($user_id);
			$give = (!is_null($src) && $src["owner"] != $user_owner);

			$person_id = ($give) ? $src["owner"] : $dest["owner"];
			$person_name = $person->getName($person_id);

			$person_acc_id = ($give) ? $tr["src_id"] : $tr["dest_id"];
			$person_acc = $acc->getProperties($person_acc_id);
			$person_res_balance = $person_acc["balance"];
			$person_balance = $person_res_balance + (($give) ? $tr["src_amount"] : -$tr["dest_amount"]);

			$debtAcc = $give ? $dest : $src;
			$noAccount = is_null($debtAcc);

			$srcAmountCurr = $tr["src_curr"];
			$destAmountCurr = $tr["dest_curr"];
			if ($noAccount)
			{
				$destAmountCurr = $person_acc["curr"];

				$acc = new Account($user_id);
				$acc_id = $acc->getIdByPos(0);
				$acc_name = $acc->getName($acc_id);
				$acc_balance = Currency::format($acc->getBalance($acc_id), $acc->getCurrency($acc_id));
				$acc_ic = $acc->getIconClass($acc->getIcon($acc_id));
			}
			else
			{
				$acc_id = 0;
			}

			$showSrcAmount = TRUE;
			$showDestAmount = FALSE;
		}


		// Common arrays
		$currArr = Currency::getArray();
		$acc = new Account($user_id);
		$accArr = $acc->getArray();
		if ($trans_type == DEBT)
			$persArr = $person->getArray();

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

			if ($give)
				$debtAcc["balfmt"] = Currency::format($debtAcc["balance"] - $tr["dest_amount"], $debtAcc["curr"]);
			else
				$debtAcc["balfmt"] = Currency::format($debtAcc["balance"] + $tr["src_amount"], $debtAcc["curr"]);

			$p_balfmt = Currency::format($person_balance, $srcAmountCurr);
		}

		$srcAmountSign = Currency::getSign($srcAmountCurr);
		$destAmountSign = Currency::getSign($destAmountCurr);
		$exchSign = $destAmountSign."/".$srcAmountSign;
		$exchValue = round($tr["src_amount"] / $tr["dest_amount"], 5);

		$rtSrcAmount = Currency::format($tr["src_amount"], $srcAmountCurr);
		$rtDestAmount = Currency::format($tr["dest_amount"], $destAmountCurr);
		$rtExchange = $exchValue." ".$exchSign;
		if ($trans_type != DEBT)
		{
			$rtSrcResBal = Currency::format($src["balance"], $src["curr"]);
			$rtDestResBal = Currency::format($dest["balance"], $dest["curr"]);
		}
		else
		{
			$rtSrcResBal = Currency::format($person_res_balance, $srcAmountCurr);
			$rtDestResBal = Currency::format($debtAcc["balance"], $debtAcc["curr"]);
		}

		$dateFmt = date("d.m.Y", strtotime($tr["date"]));

		$titleString = "Jezve Money | ";
		if ($trans_type == DEBT)
			$headString = "Edit debt";
		else
			$headString = "Edit transaction";
		$titleString .= $headString;

		$cssArr = array("common.css", "transaction.css", "tiles.css", "iconlink.css", "ddlist.css", "calendar.css");
		$jsArr = array("es5-shim.min.js", "common.js", "app.js", "selection.js", "currency.js", "account.js", "person.js", "calendar.js", "ddlist.js", "tr_model.js", "tr_viewmodel.js");
		$cssArr[] = "popup.css";
		$jsArr[] = "popup.js";

		include("./view/templates/transaction.tpl");
	}


	public function createTransaction()
	{
		global $user_id;

		if (!isset($_GET["type"]))
			$this->fail();
		$trans_type = Transaction::getStringType($_GET["type"]);
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

			$pers = new Person($user_id);
			if (!$pers->is_exist($person_id))		// person should exist
				$this->fail($defMsg);

			$debt = new Debt($user_id);
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

		$trans = new Transaction($user_id);

		if ($trans_type == DEBT)
		{
			if (!$debt->create($debt_op, $acc_id, $person_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment))
				$this->fail($defMsg);
			setMessage(MSG_DEBT_CREATE);
			setLocation(BASEURL."transactions/?type=debt");
		}
		else
		{
			if ($trans_type == EXPENSE && (!$src_id || !$src_curr || !$dest_curr))
				fail($defMsg);
			if ($trans_type == INCOME && (!$dest_id || !$src_curr || !$dest_curr))
				fail($defMsg);
			if ($trans_type == TRANSFER && (!$src_id || !$dest_id || !$src_curr || !$dest_id))
				fail($defMsg);

			if (!$trans->create($trans_type, $src_id, $dest_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment))
				$this->fail($defMsg);
			setMessage(MSG_TRANS_CREATE);
			setLocation(BASEURL);
		}
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

			$pers = new Person($user_id);
			if (!$pers->is_exist($person_id))		// person should exist
				$this->fail($defMsg);

			$debt = new Debt($user_id);
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

		$trans = new Transaction($user_id);

		if (!isset($_POST["transid"]))
			$this->fail($defMsg);
		$trans_id = intval($_POST["transid"]);
		if ($trans_type == DEBT)
		{
			if (!$debt->edit($trans_id, $debt_op, $acc_id, $person_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment))
				$this->fail($defMsg);
			setMessage(MSG_DEBT_UPDATE);
		}
		else
		{
			if (!$trans->edit($trans_id, $trans_type, $src_id, $dest_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment))
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

		$trans = new Transaction($user_id);

		if (!isset($_POST["transactions"]))
			$this->fail($defMsg);
		$trans_arr = explode(",", $_POST["transactions"]);
		foreach($trans_arr as $trans_id)
		{
			$trans_id = intval($trans_id);
			if (!$trans->del($trans_id))
				$this->fail();
		}

		setMessage(MSG_TRANS_DELETE);
		setLocation(BASEURL."transactions/");
	}
}
