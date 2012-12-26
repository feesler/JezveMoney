<?php

// Set location header to redirect page
function setLocation($loc)
{
	header("Location: ".$loc);
}


// Set password hash for specified user
function setUserHash($login, $passhash)
{
	global $db;

	$elogin = $db->escape($login);

	return $db->updateQ("users", array("passhash"), array($passhash), "login=".qnull($elogin));
}


// Set password hash for specified user
function getUserHash($login)
{
	global $db;

	$elogin = $db->escape($login);

	$resArr = $db->selectQ("passhash", "users", "login=".qnull($elogin));
	if (count($resArr) == 1)
		return $resArr[0]["passhash"];
	else
		return NULL;
}


function getSalt($str)
{
	$bfPrefix = "\$2a\$10\$";

	return substr($bfPrefix.md5($str), 0, 28);
}


function getHash($str, $salt)
{
	return substr(crypt($str, $salt), 28);
}


// Check correctness of hash
function checkHash($str, $salt, $hash)
{
	$full_hash = $salt.$hash;

	return (crypt($str, $salt) == $full_hash);
}


// Create pre hash
function createPreHash($login, $password)
{
	$salt = getSalt($login);
	return getHash($password, $salt);
}


// Create hash for user
function createUserHash($login, $password)
{
	$salt = getSalt($login);
	$hashed = getHash($password, $salt);

	return getHash($hashed, $salt);
}


// Check correctness login/password data
function checkLoginData($login, $password)
{
	$salt = getSalt($login);
	$hashed = getHash($password, $salt);
	$userHash = getUserHash($login);

	return checkHash($hashed, $salt, $userHash);
}


// Check correctness cookies data
function checkCookie($login, $passhash)
{
	$salt = getSalt($login);
	$userHash = getUserHash($login);

	return checkHash($passhash, $salt, $userHash);
}


// Setup cookies
function setupCookies($login, $passhash)
{
	$expTime = time() + 31536000;	// year after now
	$path = "/money/";
	$domain = "jezve.net";

	setcookie("login", $login, $expTime, $path, $domain);
	setcookie("passhash", $passhash, $expTime, $path, $domain);
}


// Delete cookies
function deleteCookies()
{
	$expTime = time() - 3600;	// hour before now
	$path = "/money/";
	$domain = "jezve.net";

	setcookie("login", "", $expTime, $path, $domain);
	setcookie("passhash", "", $expTime, $path, $domain);
}


// Check is user logged in or redirect to specified URL
function checkUser($url)
{
	global $db;

	if (isset($_SESSION["userid"]))
	{
		return intval($_SESSION["userid"]);
	}
	else
	{
		if (isset($_COOKIE["login"]) && isset($_COOKIE["passhash"]))
		{
			$loginCook = $_COOKIE["login"];
			$passCook = $_COOKIE["passhash"];

			if (checkCookie($loginCook, $passCook))
			{
				session_start();

				$user_id = getUserId($loginCook);
				$_SESSION["userid"] = $user_id;

				setupCookies($loginCook, $passCook);

				return $user_id;
			}
		}

		setLocation($url);
		exit();
	}
}


// Return string for CSS style link
function getCSS($filename)
{
	return "<link rel=\"stylesheet\" type=\"text/css\" href=\"./css/".$filename."\">\r\n";
}


// Print common styles for specifyed theme
function getStyle($theme)
{
	echo(getCSS("common.css"));
	echo(getCSS((($theme == 1) ? "white.css" : "black.css")));
}


// Print string with carriage return
function ebr($str = "")
{
	echo($str."\r\n");
}


// Print HTML comment
function htmlComm($str)
{
	echo("<!-- ".$str." -->\r\n");
}

// Print JavaScript comment
function jsComm($str)
{
	echo("/* ".$str." */\r\n");
}


// Format value
function valFormat($format, $value)
{
	if ($format && $format != "")
		return sprintf($format, number_format($value, 2, ",", " "));
	else
		return number_format($value, 2, ",", " ");
}


// Format value in specified currency
function currFormat($value, $curr_id)
{
	global $db;

	$resArr = $db->selectQ("format", "currency", "id=".$curr_id);
	return valFormat((count($resArr) == 1) ? $resArr[0]["format"] : "", $value);
}


// Return currency name
function getCurrencyName($curr_id)
{
	global $db;

	$resArr = $db->selectQ("name", "currency", "id=".$curr_id);

	return ((count($resArr) == 1) ? $resArr[0]["name"] : "");
}


// Return currency of account
function getAccountCurrency($account_id)
{
	global $db;

	$resArr = $db->selectQ("curr_id", "accounts", "id=".$account_id);

	return ((count($resArr) == 1) ? intval($resArr[0]["curr_id"]) : 0);
}


// Return user name
function getUserName($id)
{
	global $db;

	$eid = intval($id);
	if (!$eid)
		return NULL;

	$resArr = $db->selectQ("login", "users", "id=".$eid);

	return ((count($resArr) == 1) ? $resArr[0]["login"] : NULL);
}


// Return user name
function getUserId($login)
{
	global $db;

	$elogin = $db->escape($login);
	if (!$elogin)
		return 0;

	$resArr = $db->selectQ("id", "users", "login=".qnull($elogin));

	return ((count($resArr) == 1) ? intval($resArr[0]["id"]) : 0);
}


// Return user block string
function getUserBlock($id)
{
	$resStr = "\t<tr>\r\n\t<td style=\"margin-top: 15px; margin-right: 30px; width: 100%; height: 30px;\" align=\"right\">";
	$resStr .= "\t\t<form id=\"logoutfrm\" name=\"logoutfrm\" method=\"post\" action=\"./modules/logout.php\">";
	$resStr .= "\t\t<span style=\"margin-right: 20px;\">".
	$resStr .= getUserName($id);
	$resStr .= " logged in</span><input class=\"btn\" type=\"submit\" value=\"Logout\">";
	$resStr .= "\t</form>\r\n\t</td>\r\n\t</tr>\r\n";

	return $resStr;
}


// Return table of accounts of user
function getAccountsTable($user_id, $transfer = FALSE, $editlink = FALSE)
{
	global $db;

	$resStr = "";

	$resStr .= "\t<tr>\r\n\t<td>\r\n\t<table class=\"infotable\">\r\n";

	$resArr = $db->selectQ("*", "accounts", "user_id=".$user_id);
	$accounts = count($resArr);
	if ((!$accounts && !$transfer) || ($accounts < 2 && $transfer))
	{
		$resStr .= "\t\t<tr><td><span>";
		if ($transfer)
			$resStr .= "You need at least two accounts to transfer.";
		else
			$resStr .= "You have no one account. Please create one.";
		$resStr .= "</span></td></tr>\r\n";
	}
	else
	{
		$resStr .= "\t\t<tr><td><b>Name</b></td><td><b>Currency</b></td><td><b>Balance</b></td>";
		if ($editlink == TRUE)
			$resStr .= "<td></td>";
		$resStr .= "</tr>\r\n";

		$totalArr = array();
		foreach($resArr as $row)
		{
			$balfmt = currFormat($row["balance"], $row["curr_id"]);
			$currname = getCurrencyName($row["curr_id"]);

			if ($currname != "" && !$totalArr[$row["curr_id"]])
				$totalArr[$row["curr_id"]] = 0;

			$totalArr[$row["curr_id"]] += $row["balance"];

			$resStr .= "\t\t<tr><td>".$row["name"]."</td><td>".$currname."</td><td style=\"text-align: right;\">".$balfmt."</td>";
			if ($editlink == TRUE)
				$resStr .= "<td><a href=\"./editaccount.php?id=".$row["id"]."\">edit</a> <a href=\"./checkbalance.php?id=".$row["id"]."\">check</a></td>";
			$resStr .= "</tr>\r\n";
		}

		$resStr .= "\t\t<tr style=\"background-color: transparent;\">";
		$resStr .= "<td colspan=\"".(($editlink == TRUE) ? "4" : "3")."\" style=\"height: 10px;\"></td></tr>\r\n";

		foreach($totalArr as $key => $value)
		{
			$valfmt = currFormat($value, $key);
			$currname = getCurrencyName($key);
			$resStr .= "<tr><td>Total</td><td>".$currname."</td><td style=\"text-align: right;\">".$valfmt."</td>";
			if ($editlink == TRUE)
				$resStr .= "<td></td>";
			$resStr .= "</tr>";
		}
	}

	$resStr .= "\t</table>\r\n\t</td>\r\n\t</tr>\r\n";

	return $resStr;
}


// Return account name
function getAccountName($account_id)
{
	global $db;

	$resArr = $db->selectQ("*", "accounts", "id=".intval($account_id));

	return (count($resArr) == 1) ? $resArr[0]["name"] : "";
}


// Return HTML string of currencies for select control
function getCurrencyList($selected_id = 0)
{
	global $db;

	$resStr = "";

	$resArr = $db->selectQ("*", "currency");
	foreach($resArr as $row)
	{
		$resStr .= "\t\t\t<option value=\"".$row["id"]."\"";
		if ($row["id"] == $selected_id)
			$resStr .= " selected";
		$resStr .= ">".$row["name"]."</option>\r\n";
	}

	return $resStr;
}


// Return HTML string of accounts for select control
function getAccountsList($user_id, $selected_id = 0)
{
	global $db;

	$resStr = "";

	$resArr = $db->selectQ("*", "accounts", "user_id=".$user_id);
	foreach($resArr as $row)
	{
		$resStr .= "\t\t\t\t<option value=\"".$row["id"]."\"";
		if (intval($row["id"]) == $selected_id)
			$resStr .= " selected";
		$resStr .= ">".$row["name"]."</option>\r\n";
	}

	return $resStr;
}


// Return Javascript array of currencies
function getCurrencyArray()
{
	global $db;

	$resStr = "";

	$resArr = $db->selectQ("id, name, sign", "currency", NULL, NULL, "id");
	$currcount = count($resArr);
	$resStr .= "var currency = [";
	foreach($resArr as $i => $row)
	{
		$resStr .= "[".$row["id"].", ".json_encode($row["name"]).", ".json_encode($row["sign"])."]".(($i < $currcount - 1) ? ", " : "];\r\n");
	}

	return $resStr;
}


// Return Javascript array of accounts
function getAccountsArray($user_id)
{
	global $db;

	$resStr = "";

	$resArr = $db->selectQ("c.id AS curr_id, c.sign AS sign, a.id AS id, a.balance AS balance", "accounts AS a, currency AS c", "a.user_id=".$user_id." AND c.id=a.curr_id");
	$accounts = count($resArr);
	$resStr .= "var accounts = [";
	foreach($resArr as $i => $row)
	{
		$resStr .= "[".$row["id"].", ".$row["curr_id"].", ".json_encode($row["sign"]).", ".$row["balance"]."]".(($i < $accounts - 1) ? ", " : "];\r\n");
	}

	return $resStr;
}


// Return array of currency information of accounts
function getAccCurrInfo($user_id)
{
	global $db;

	$accCurr = array();

	$resArr = $db->selectQ("c.id AS curr_id, c.sign AS sign, a.id AS id, a.balance AS balance", "accounts AS a, currency AS c", "a.user_id=".$user_id." AND c.id=a.curr_id");
	foreach($resArr as $i => $row)
	{
		$accCurr[$i]["id"] = intval($row["id"]);
		$accCurr[$i]["curr_id"] = intval($row["curr_id"]);
		$accCurr[$i]["sign"] = $row["sign"];
	}

	return $accCurr;
}


// Return currency id of specified account from information array
function getCurrId($accCurr, $account_id)
{
	if (!count($accCurr) || !$account_id)
		return 0;

	foreach($accCurr as $ac)
	{
		if (intval($ac["id"]) == $account_id)
			return $ac["curr_id"];
	}

	return 0;
}


// Return currency sign of specified account from information array
function getCurSign($accCurr, $account_id)
{
	if (!count($accCurr) || !$account_id)
		return NULL;

	foreach($accCurr as $ac)
	{
		if (intval($ac["id"]) == $account_id)
			return $ac["sign"];
	}

	return NULL;
}


// Return currency sign by specified id
function getSign($accCurr, $curr_id)
{
	if (!count($accCurr) || !$curr_id)
		return NULL;

	foreach($accCurr as $ac)
	{
		if (intval($ac["curr_id"]) == $curr_id)
			return $ac["sign"];
	}

	return NULL;
}


// Cancel changes of transaction
function cancelTransaction($trans_id)
{
	global $db;

	// check transaction is exist
	$transArr = $db->selectQ("*", "transactions", "id=".$trans_id);
	if (count($transArr) != 1)
		return FALSE;

	$trans = $transArr[0];
	$src_id = intval($trans["src_id"]);
	$dest_id = intval($trans["dest_id"]);
	$transType = intval($trans["type"]);
	$transAmount = floatval($trans["amount"]);
	$transCharge = floatval($trans["charge"]);

	// check source account is exist
	$srcBalance = 0;
	if ($src_id != 0)
	{
		$resArr = $db->selectQ("*", "accounts", "id=".$src_id);
		if (count($resArr) != 1)
			return FALSE;
	
		$srcBalance = floatval($resArr[0]["balance"]);
	}

	// check destination account is exist
	$destBalance = 0;
	if ($dest_id != 0)
	{
		$resArr = $db->selectQ("*", "accounts", "id=".$dest_id);
		if (count($resArr) != 1)
			return FALSE;

		$destBalance = floatval($resArr[0]["balance"]);
	}

	if ($transType == 1)		// spend
	{
		// update balance of account
		$srcBalance += $transCharge;
		if (!$db->updateQ("accounts", array("balance"), array($srcBalance), "id=".$src_id))
			fail();
	}
	else if ($transType == 2)		// income
	{
		// update balance of account
		$destBalance -= $transCharge;
		if (!$db->updateQ("accounts", array("balance"), array($destBalance), "id=".$dest_id))
			fail();
	}
	else if ($transType == 3)		// transfer
	{
		// update balance of source account
		$srcBalance += $transCharge;
		if (!$db->updateQ("accounts", array("balance"), array($srcBalance), "id=".$src_id))
			return FALSE;

		// update balance of destination account
		$destBalance -= $transAmount;
		if (!$db->updateQ("accounts", array("balance"), array($destBalance), "id=".$dest_id))
			return FALSE;
	}
	else
		return FALSE;

	return TRUE;
}


// Return latest position of user transactions
function getLatestTransactionPos($user_id)
{
	global $db;

	$user_id = intval($user_id);
	if (!user_id)
		return 0;

	$resArr = $db->selectQ("pos",
				"transactions",
				"user_id=".$user_id,
				NULL,
				"pos DESC LIMIT 1");

	if (count($resArr) != 1)
		return 0;

	return intval($resArr[0]["pos"]);
}


// Return charge from transaction array
function getCharge($trans_row)
{
	if ($trans_row)
		return floatval($trans_row["charge"]);
	else
		return 0.0;
}


// Return amount from transaction array
function getAmount($trans_row)
{
	if ($trans_row)
		return floatval($trans_row["amount"]);
	else
		return 0.0;
}


// Return javascript array of amounts of specified transactions for statistics use
function getStatArray($user_id, $account_id, $trans_type, $group_type = 0)
{
	global $db;

	$resStr = "";

	$user_id = intval($user_id);
	$account_id = intval($account_id);
	$trans_type = intval($trans_type);

	if (!$user_id || !$account_id || !$trans_type)
		return $resStr;

	$cond =  "user_id=".$user_id." AND type=".$trans_type;

	if ($trans_type == 1)			// expense or transfer
		$cond .= " AND src_id=".$account_id;
	else if ($trans_type == 2)		// income
		$cond .= " AND dest_id=".$account_id;

	$resArr = $db->selectQ("*", "transactions", $cond, NULL, "pos ASC");
	$rowCount = count($resArr);

	$chargeArr = array();
	$sumDate = NULL;
	$curSum = 0.0;
	$itemNum = 0;

	for($i = 0; $i < $rowCount; $i++)
	{
		$row = $resArr[$i];
		$trans_time = strtotime($row["date"]);

		if ($group_type == 0)		// no grouping
		{
			$chargeArr[$i] = getCharge($row);
		}
		else if ($group_type == 1)	// group by day
		{
			$dateInfo = getdate($trans_time);
			$curDate = $dateInfo["mday"];
		}
		else if ($group_type == 2)	// group by week
		{
			$curDate = intval(date("W", $trans_time));
		}
		else if ($group_type == 3)	// group by month
		{
			$dateInfo = getdate($trans_time);
			$curDate = $dateInfo["mon"];
		}
		else if ($group_type == 4)	// group by year
		{
			$dateInfo = getdate($trans_time);
			$curDate = $dateInfo["year"];
		}

		if ($sumDate == NULL)		// first iteration
		{
			$sumDate = $curDate;
		}
		else	if ($sumDate != NULL && $sumDate != $curDate)
		{
			$sumDate = $curDate;
			$chargeArr[$itemNum] = $curSum;
			$curSum = 0.0;
			$itemNum++;
		}

		$curSum += getCharge($row);
	}

	if ($group_type != 0 && $curSum != 0.0)
	{
		$chargeArr[$itemNum] = $curSum;
	}

	$resStr .= implode(", ", $chargeArr);

	return $resStr;
}


?>