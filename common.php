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
	$arr = selectQuery('login', 'users', '`id`='.$id);
	return (($arr) ? $arr['login'] : '');
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

?>