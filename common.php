<?php
	
	// Set location header to redirect page and exit from script
	function setLocation($loc)
	{
		header("Location: ".$loc);
		exit();
	}


	// Return string for common headers
	function getCommonHeaders()
	{
		$resStr = "";

		$resStr .= "<meta http-equiv=\"content-type\" content=\"text/html; charset=utf-8\">\r\n";
		$resStr .= "<meta name=\"viewport\" content=\"width=device-width,maximum-scale=1,initial-scale=1,user-scalable=0\">";

		return $resStr;
	}


	// Return string for CSS style link
	function getCSS($filename)
	{
		return "<link rel=\"stylesheet\" type=\"text/css\" href=\"./css/".$filename."\">";
	}


	// Print common styles for specifyed theme
	function getStyle($theme)
	{
		html(getCSS("common.css"));
		html(getCSS((($theme == 1) ? "white.css" : "black.css")));
	}


	// Return string for JavaScript include
	function getJS($filename)
	{
		return "<script type=\"text/javascript\" src=\"./js/".$filename."\"></script>";
	}


	static $tabbing = 0;
	static $tabStr = "";


	// Set count of tabs
	function setTab($tabCount)
	{
		global $tabbing, $tabStr;

		if ($tabbing == $tabCount)
			return;

		$tabStr = "";
		for($i = 0; $i < $tabCount; $i++)
			$tabStr .= "\t";
		$tabbing = $tabCount;
	}


	// Increase count of tabs
	function pushTab($pushCount = 1)
	{
		global $tabbing;

		setTab($tabbing + $pushCount);
	}


	// Decrease count of tabs
	function popTab($popCount = 1)
	{
		global $tabbing;

		if (!$tabbing)
			return;

		setTab(($popCount >= $tabbing) ? 0 : ($tabbing - $popCount));
	}


	define("PUSH_AFTER", 1, TRUE);
	define("PUSH_BEFORE", 2, TRUE);
	define("POP_AFTER", 3, TRUE);
	define("POP_BEFORE", 4, TRUE);

	// Print specified HTML string with tabbing and carriage return
	function html($str = "", $opt = 0)
	{
		global $tabStr;

		if ($opt == POP_BEFORE)
			popTab();
		else if ($opt == PUSH_BEFORE)
			pushTab();

		if (!is_null($str) && $str != "")
			echo($tabStr.$str."\r\n");
		else
			echo("\r\n");

		if ($opt == POP_AFTER)
			popTab();
		else if ($opt == PUSH_AFTER)
			pushTab();
	}


	// Alias for html(str, PUSH_AFTER)
	function html_op($str)
	{
		html($str, PUSH_AFTER);
	}


	// Alias for html(str, POP_BEFORE)
	function html_cl($str)
	{
		html($str, POP_BEFORE);
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