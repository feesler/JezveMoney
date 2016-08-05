<?php

	define("EXPENSE", 1, TRUE);
	define("INCOME", 2, TRUE);
	define("TRANSFER", 3, TRUE);
	define("DEBT", 4, TRUE);


	// Set location header to redirect page and exit from script
	function setLocation($loc)
	{
		header("Location: ".$loc);
		exit();
	}


	$classes = array("CachedTable" => "system/cachedTable.php",
					"Controller" => "system/controller.php",
					"MainController" => "Controller/main.php",
					"AccountsController" => "Controller/accounts.php",
					"PersonsController" => "Controller/persons.php",
					"TransactionsController" => "Controller/transactions.php",
					"UserController" => "Controller/user.php",
					"ProfileController" => "Controller/profile.php",
					"StatisticsController" => "Controller/statistics.php",
					"CurrencyController" => "admin/Controller/currency.php",
					"Account" => "Model/account.php",
					"Currency" => "Model/currency.php",
					"Debt" => "Model/debt.php",
					"Currency" => "Model/currency.php",
					"mysqlDB" => "system/mysql.php",
					"Person" => "Model/person.php",
					"Transaction" => "Model/transaction.php",
					"User" => "Model/user.php",
					"apiResponse" => "api/apiResponse.php");

	// Check class name and try to load file
	function autoLoadClass($className)
	{
		global $approot, $classes;

		foreach($classes as $clName => $clPath)
		{
			if ($clName == $className)
			{
				require($approot.$clPath);
				break;
			}
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
			$str = str_replace(array("\r\n", "\r", "\n"), "<br>", $str);

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

		if (floor($val) == $val)
			$nf = number_format($val, 0, "", " ");
		else
			$nf = number_format($val, 2, ",", " ");

		if ($format && $format != "")
			return sprintf($format, $nf);
		else
			return $nf;
	}


	// Return javascript array of amounts of specified transactions for statistics use
	function getStatArray($user_id, $byCurrency, $curr_acc_id, $trans_type, $group_type = 0, $limit = 0)
	{
		global $db;

		$user_id = intval($user_id);
		$curr_acc_id = intval($curr_acc_id);
		$trans_type = intval($trans_type);

		if (!$user_id || !$curr_acc_id || !$trans_type)
			return NULL;

		$amountArr = array();
		$groupArr = array();
		$sumDate = NULL;
		$curDate = NULL;
		$prevDate = NULL;
		$curSum = 0.0;
		$itemsInGroup = 0;
		$trans_time = 0;

		$fields = array("tr.date" => "date", "tr.src_amount" => "src_amount", "tr.dest_amount" => "dest_amount");
		$tables = array("transactions" => "tr");
		$condArr =  array("tr.user_id=".$user_id, "tr.type=".$trans_type);

		if ($byCurrency)
		{
			$tables["accounts"] = "a";
			$condArr[] = "a.curr_id=".$curr_acc_id;
			if ($trans_type == 1)			// expense or transfer
				$condArr[] = "tr.src_id=a.id";
			else if ($trans_type == 2)		// income
				$condArr[] = "tr.dest_id=a.id";
		}
		else
		{
			if ($trans_type == 1)			// expense or transfer
				$condArr[] = "tr.src_id=".$curr_acc_id;
			else if ($trans_type == 2)		// income
				$condArr[] = "tr.dest_id=".$curr_acc_id;
		}

		$resArr = $db->selectQ($fields, $tables, $condArr, NULL, "pos ASC");
		foreach($resArr as $row)
		{
			$trans_time = strtotime($row["date"]);
			$dateInfo = getdate($trans_time);
			$itemsInGroup++;

			if ($group_type == 0)		// no grouping
			{
				$amountArr[] = floatval($row[($trans_type == 1) ? "src_amount" : "dest_amount"]);

				if ($prevDate == NULL || $prevDate != $dateInfo["mday"])
				{
					$groupArr[] = array(date("d.m.Y", $trans_time), $itemsInGroup);
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
				$groupArr[] = array(date("d.m.Y", $trans_time), 1);
			}

			$curSum += floatval($row[($trans_type == 1) ? "src_amount" : "dest_amount"]);
		}

		// save remain value
		if ($group_type != 0 && $curSum != 0.0)
		{
			if ($sumDate != NULL && $sumDate != $curDate)
			{
				$amountArr[] = $curSum;
				$groupArr[] = array(date("d.m.Y", $trans_time), 1);
			}
			else
			{
				if (!count($amountArr))
					$amountArr[] = $curSum;
				else
					$amountArr[count($amountArr) - 1] += $curSum;
				if (!count($groupArr))
					$groupArr[] = array(date("d.m.Y", $trans_time), 1);
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


	// Prepare matches callback for preg_replace_callback
	function prepareUTF8($matches)
	{
		return json_decode('"'.$matches[1].'"');
	}


	// Fixed json_encode function
	function f_json_encode($obj)
	{
		return preg_replace_callback('/((\\\u[01-9a-fA-F]{4})+)/', 'prepareUTF8', json_encode($obj));
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

		$pairs = array();
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


	$u = NULL;
	$user_id = 0;
	$user_name = NULL;

	// Check user status required for page access
	function checkUser($loggedIn = TRUE, $adminOnly = FALSE)
	{
		global $u, $user_id, $user_name;

		$u = new User();
		// Check session and cookies
		$user_id = $u->check();

		// Get name of user person
		if ($user_id)
		{
			$owner_id = $u->getOwner($user_id);
			$pers = new Person($user_id);
			$user_name = $pers->getName($owner_id);
		}

		if ($loggedIn)		// user should be logged in to access
		{
			if (!$user_id)
				setLocation(BASEURL."login/");
			else if ($adminOnly && !$u->isAdmin($user_id))
				setLocation(BASEURL);
		}
		else				// user should be logged out ot access
		{
			if ($user_id != 0)
				setLocation(BASEURL);
		}
	}
