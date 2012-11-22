<?php

// Set location header to redirect page
function setLocation($loc)
{
	header("Location: ".$loc);
}


// Check is user logged in or redirect to specified URL
function checkUser($url)
{
	if (isset($_SESSION["userid"]))
	{
		return intval($_SESSION["userid"]);
	}
	else
	{
		setLocation($url);
		exit();
	}
}


function getStyle($theme)
{
	echo("<link rel=\"stylesheet\" type=\"text/css\" href=\"./css/common.css\">\r\n");
	echo("<link rel=\"stylesheet\" type=\"text/css\" href=\"./css/".(($theme == 1) ? "white" : "black").".css\">\r\n");
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

	$arr = $db->selectQ("login", "users", "id=".$id);

	return ((count($arr) == 1) ? $arr[0]["login"] : "");
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

	$resStr .= "\t<tr>\r\n\t<td>\r\n\t<table>\r\n";

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
		$resStr .= "\t\t<tr><td>Name</td><td>Currency</td><td>Balance</td>";
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

			$resStr .= "\t\t<tr><td>".$row["name"]."</td><td>".$currname."</td><td>".$balfmt."</td>";
			if ($editlink == TRUE)
				$resStr .= "<td><a href=\"./editaccount.php?id=".$row["id"]."\">edit</a></td>";
			$resStr .= "</tr>\r\n";
		}

		$resStr .= "\t\t<tr><td colspan=\"3\" style=\"height: 10px;\"></td></tr>\r\n";

		foreach($totalArr as $key => $value)
		{
			$valfmt = currFormat($value, $key);
			$currname = getCurrencyName($key);
			$resStr .= "<tr><td>Total</td><td>".$currname."</td><td>".$valfmt."</td></tr>";
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

?>