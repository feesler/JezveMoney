<?php
	
	// Set location header to redirect page and exit from script
	function setLocation($loc)
	{
		header("Location: ".$loc);
		exit();
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


	// Return string for JavaScript include
	function getJS($filename)
	{
		return "<script type=\"text/javascript\" src=\"./js/".$filename."\"></script>\r\n";
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