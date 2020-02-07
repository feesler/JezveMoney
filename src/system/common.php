<?php

	define("EXPENSE", 1);
	define("INCOME", 2);
	define("TRANSFER", 3);
	define("DEBT", 4);


	// Set location header to redirect page and exit from script
	function setLocation($loc)
	{
		header("Location: ".$loc);
		exit();
	}


	// Check class name and try to load file
	function autoLoadClass($className)
	{
		$classes = [
			"CachedTable" => "system/cachedTable.php",
			"Controller" => "system/controller.php",
			"Model" => "system/model.php",
			"Singleton" => "system/singleton.php",
			"ApiController" => "system/apicontroller.php",
			"AdminController" => "system/admincontroller.php",
		// Controllers
			"MainController" => "Controller/main.php",
			"AccountsController" => "Controller/accounts.php",
			"PersonsController" => "Controller/persons.php",
			"TransactionsController" => "Controller/transactions.php",
			"UserController" => "Controller/user.php",
			"ProfileController" => "Controller/profile.php",
			"StatisticsController" => "Controller/statistics.php",
			"FastCommitController" => "Controller/fastcommit.php",
			"CheckBalanceController" => "Controller/checkbalance.php",
		// API controllers
			"CurrencyApiController" => "api/Controller/currency.php",
			"AccountApiController" => "api/Controller/account.php",
			"PersonApiController" => "api/Controller/person.php",
			"TransactionApiController" => "api/Controller/transaction.php",
			"UserApiController" => "api/Controller/user.php",
			"ProfileApiController" => "api/Controller/profile.php",
		// Admin controllers
			"CurrencyAdminController" => "admin/Controller/currency.php",
			"BalanceAdminController" => "admin/Controller/balance.php",
			"UserAdminController" => "admin/Controller/user.php",
			"MainAdminController" => "admin/Controller/main.php",
			"QueryAdminController" => "admin/Controller/query.php",
			"LogsAdminController" => "admin/Controller/log.php",
			"TestsAdminController" => "admin/Controller/tests.php",
			"ApiConsoleAdminController" => "admin/Controller/apiconsole.php",
		// Models
			"AccountModel" => "Model/account.php",
			"CurrencyModel" => "Model/currency.php",
			"DebtModel" => "Model/debt.php",
			"mysqlDB" => "system/mysql.php",
			"PersonModel" => "Model/person.php",
			"TransactionModel" => "Model/transaction.php",
			"UserModel" => "Model/user.php",
			"apiResponse" => "system/apiResponse.php"
		];

		if (isset($classes[$className]))
		{
			require(APPROOT.$classes[$className]);
		}
	}


	// Check string is null or empty
	function is_empty($str)
	{
		return is_null($str) || $str == "";
	}


	// Convert string to be compatible with HTML
	function htmlConvert($str, $lineEnd = FALSE)
	{
		$str = htmlentities($str, ENT_QUOTES, "UTF-8");
		if ($lineEnd)
			$str = str_replace(["\r\n", "\r", "\n"], "<br>", $str);

		return $str;
	}


	// Short alias for htmlConvert
	function e($str)
	{
		return htmlConvert($str);
	}


	// Format value
	function valFormat($format, $val)
	{
		if (!is_numeric($val))
			return "";

		$val = floatval($val);

		if (strval(round($val)) == strval($val))
			$nf = number_format($val, 0, "", " ");
		else
			$nf = number_format($val, 2, ".", " ");

		if ($format && $format != "")
			return sprintf($format, $nf);
		else
			return $nf;
	}


	// Return javascript array of amounts of specified transactions for statistics use
	function getStatArray($user_id, $byCurrency, $curr_acc_id, $trans_type, $group_type = 0, $limit = 0)
	{
		$db = mysqlDB::getInstance();

		$user_id = intval($user_id);
		$curr_acc_id = intval($curr_acc_id);
		$trans_type = intval($trans_type);

		if (!$user_id || !$curr_acc_id || !$trans_type)
			return NULL;

		$amountArr = [];
		$groupArr = [];
		$sumDate = NULL;
		$curDate = NULL;
		$prevDate = NULL;
		$curSum = 0.0;
		$itemsInGroup = 0;
		$trans_time = 0;

		$fields = ["tr.date" => "date", "tr.src_amount" => "src_amount", "tr.dest_amount" => "dest_amount"];
		$tables = ["transactions" => "tr"];
		$condArr =  ["tr.user_id=".$user_id, "tr.type=".$trans_type];

		if ($byCurrency)
		{
			$tables["accounts"] = "a";
			$condArr[] = "a.curr_id=".$curr_acc_id;
			if ($trans_type == EXPENSE)			// expense
				$condArr[] = "tr.src_id=a.id";
			else if ($trans_type == INCOME)		// income
				$condArr[] = "tr.dest_id=a.id";
		}
		else
		{
			if ($trans_type == EXPENSE)			// expense
				$condArr[] = "tr.src_id=".$curr_acc_id;
			else if ($trans_type == INCOME)		// income
				$condArr[] = "tr.dest_id=".$curr_acc_id;
		}

		$qResult = $db->selectQ($fields, $tables, $condArr, NULL, "pos ASC");
		while($row = $db->fetchRow($qResult))
		{
			$trans_time = strtotime($row["date"]);
			$dateInfo = getdate($trans_time);
			$itemsInGroup++;

			if ($group_type == 0)		// no grouping
			{
				$amountArr[] = floatval($row[($trans_type == EXPENSE) ? "src_amount" : "dest_amount"]);

				if ($prevDate == NULL || $prevDate != $dateInfo["mday"])
				{
					$groupArr[] = [date("d.m.Y", $trans_time), $itemsInGroup];
					$itemsInGroup = 0;
				}
				$prevDate = $dateInfo["mday"];
			}
			else if ($group_type == 1)	// group by day
			{
				$curDate = $dateInfo["mday"];
			}
			else if ($group_type == 2)	// group by week
			{
				$curDate = intval(date("W", $trans_time));
			}
			else if ($group_type == 3)	// group by month
			{
				$curDate = $dateInfo["mon"];
			}
			else if ($group_type == 4)	// group by year
			{
				$curDate = $dateInfo["year"];
			}

			if ($sumDate == NULL)		// first iteration
			{
				$sumDate = $curDate;
			}
			else if ($sumDate != NULL && $sumDate != $curDate)
			{
				$sumDate = $curDate;
				$amountArr[] = $curSum;
				$curSum = 0.0;
				$groupArr[] = [date("d.m.Y", $trans_time), 1];
			}

			$curSum += floatval($row[($trans_type == EXPENSE) ? "src_amount" : "dest_amount"]);
		}

		// save remain value
		if ($group_type != 0 && $curSum != 0.0)
		{
			if ($sumDate != NULL && $sumDate != $curDate)
			{
				$amountArr[] = $curSum;
				$groupArr[] = [date("d.m.Y", $trans_time), 1];
			}
			else
			{
				if (!count($amountArr))
					$amountArr[] = $curSum;
				else
					$amountArr[count($amountArr) - 1] += $curSum;
				if (!count($groupArr))
					$groupArr[] = [date("d.m.Y", $trans_time), 1];
				else if ($group_type == 0)
					$groupArr[count($groupArr) - 1][1]++;
			}
		}

		if ($limit > 0)
		{
			$amountCount = count($amountArr);
			$limitCount = min($amountCount, $limit);
			$amountArr = array_slice($amountArr, -$limitCount);

			$groupCount = count($groupArr);

			$newGroupsCount = 0;
			$groupLimit = 0;
			$i = $groupCount - 1;
			while($i >= 0 && $groupLimit < $limitCount)
			{
				$groupLimit += $groupArr[$i][1];

				$newGroupsCount++;
				$i--;
			}

			$groupArr = array_slice($groupArr, -$newGroupsCount);
		}

		$resObj = new stdClass;
		$resObj->values = $amountArr;
		$resObj->series = $groupArr;

		return $resObj;
	}


	// Check session and start if it is not started yet
	function sessionStart()
	{
		if (session_id())
			return;

		session_start();
	}


	// Build URL from base and array of parameters
	function urlJoin($base, $params = NULL)
	{
		$resStr = "";

		if (is_empty($base))
			return $resStr;

		$resStr = $base;

		if (!is_array($params))
			return $resStr;

		$pairs = [];
		foreach($params as $pkey => $pval)
		{
			$pairs[] = urlencode($pkey)."=".urlencode($pval);
		}
		if (count($pairs))
			$resStr .= "?";
		$resStr .= implode("&", $pairs);

		$resStr = htmlentities($resStr);

		return $resStr;
	}


	// Append to file name unique string to fix cache issues
	function auto_version($file)
	{
		if (!file_exists(APPROOT.$file))
			return $file;

		$mtime = filemtime(APPROOT.$file);
		return $file."?".$mtime;
	}


	function skipZeros($arr)
	{
		$res = [];
		if (!is_array($arr))
			$arr = [ $arr ];

		foreach($arr as $val)
		{
			$val = intval($val);
			if ($val)
				$res[] = $val;
		}

		return $res;
	}


	// Check is all of expected fields present in the array or object
	// Return array with only expected fields or FALSE if something goes wrong
	function checkFields($obj, $expectedFields, $throw = FALSE)
	{
		if (is_null($obj) || !is_array($expectedFields))
		{
			if ($throw)
				throw new Error("Invalid input");
			else
				return FALSE;
		}

		if (!is_array($obj))
			$obj = (array)$obj;

		$res = [];
		foreach($expectedFields as $field)
		{
			if (!array_key_exists($field, $obj))
			{
				$msg = "Field $field not found";
				if ($throw)
				{
					throw new Error($msg);
				}
				else
				{
					wlog("checkFields() .. ".var_export($obj, TRUE));
					wlog($msg);
					return FALSE;
				}
			}

			$res[$field] = $obj[$field];
		}

		return $res;
	}
