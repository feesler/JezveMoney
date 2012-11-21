<?php

// Check is user logged in or redirect to specified URL
function checkUser($url)
{
	if (isset($_SESSION["userid"]))
	{
		return intval($_SESSION["userid"]);
	}
	else
	{
		header("Location: $url");
		exit();
	}
}


function getStyle($theme)
{
	echo("<link rel=\"stylesheet\" type=\"text/css\" href=\"./css/common.css\">\r\n");
	echo("<link rel=\"stylesheet\" type=\"text/css\" href=\"./css/".(($theme == 1) ? "white" : "black").".css\">\r\n");
}


// Format value in specified currency
function currFormat($format, $value)
{
	if ($format && $format != "")
		return sprintf($format, number_format($value, 2, ',', ' '));
	else
		return number_format($value, 2, ',', ' ');
}


// Return user name
function getUserName($id)
{
	global $db;

	$arr = $db->selectQ('login', 'users', '`id`='.$id);

	return ((count($arr) == 1) ? $arr[0]['login'] : '');
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
function getAccountsTable($user_id, $transfer = FALSE)
{
	global $db;

	echo("\t<tr>\r\n");
	echo("\t<td>\r\n");
	echo("\t<table>\r\n");

	$resArr = $db->selectQ("*", "accounts", "user_id=".$user_id);
	$accounts = count($resArr);
	if ((!$accounts && !$transfer) || ($accounts < 2 && $transfer))
	{
		echo("\t\t<tr><td><span>");
		if ($transfer)
			echo("You need at least two accounts to transfer.");
		else
			echo("You have no one account. Please create one.");
		echo("</span></td></tr>\r\n");
	}
	else
	{
		echo("\t\t<tr><td>Name</td><td>Currency</td><td>Balance</td></tr>\r\n");
	
		foreach($resArr as $row)
		{
			$arr = $db->selectQ('*', 'currency', 'id='.$row['curr_id']);
			$currname = (count($arr) == 1 ? $arr[0]['name'] : '');
			$balfmt = currFormat((count($arr) == 1 ? $arr[0]['format'] : ''), $row['balance']);
	
			if ($currname != '' && !$totalArr[$row['curr_id']])
				$totalArr[$row['curr_id']] = 0;
	
			$totalArr[$row['curr_id']] += $row['balance'];
	
			echo("\t\t<tr><td>".$row['name']."</td><td>".$currname."</td><td>".$balfmt."</td></tr>\r\n");
		}
	
		foreach($totalArr as $key => $value)
		{
			$arr = $db->selectQ('*', 'currency', 'id='.$key);
			if (count($arr) == 1)
			{
				$valfmt = currFormat($arr[0]['format'], $value);
				echo("<tr><td>Total</td><td>".$arr[0]['name']."</td><td>".$valfmt."</td></tr>");
			}
		}

	}

	echo("\t</table>\r\n");
	echo("\t</td>\r\n");
	echo("\t</tr>\r\n");
}
?>