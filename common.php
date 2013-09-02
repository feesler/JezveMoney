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


	define("STATIC_TILE", 1, TRUE);
	define("LINK_TILE", 2, TRUE);
	define("BUTTON_TILE", 3, TRUE);

	// Return markup for tile
	function getTile($tile_type, $tile_id, $tile_title, $tile_subtitle, $tile_action)
	{
		$resStr = "";

		if ($tile_type != STATIC_TILE && $tile_type != LINK_TILE && $tile_type != BUTTON_TILE)
			return $resStr;

		$t_id = ($tile_id && $tile_id != "") ? " id=\"".$tile_id."\"" : "";

		$resStr .= "<div".$t_id." class=\"tile\">";
		if ($tile_type == STATIC_TILE)
		{
			$resStr .= "<div class=\"tilelink\">";
		}
		else if ($tile_type == LINK_TILE)
		{
			$t_href = ($tile_action && $tile_action != "") ? " href=\"".$tile_action."\"" : "";

			$resStr .= "<a".$t_href." class=\"tilelink\">";
		}
		else if ($tile_type == BUTTON_TILE)
		{
			$t_click = ($tile_action && $tile_action != "") ? " onclick=\"".$tile_action."\"" : "";
			$resStr .= "<button class=\"tilelink\"".$t_click.">";
		}

		$resStr .= "<div>";

		$resStr .= "<span class=\"acc_bal\">".$tile_subtitle."</span>";
		$resStr .= "<span class=\"acc_name\">".$tile_title."</span>";

		$resStr .= "</div>";
		if ($tile_type == STATIC_TILE)
			$resStr .= "</div>";
		else if ($tile_type == LINK_TILE)
			$resStr .= "</a>";
		else if ($tile_type == BUTTON_TILE)
			$resStr .= "</button>";
		$resStr .= "</div>";

		return $resStr;
	}


	// Return markup for right tile block
	function getRightTileBlock($div_id, $isVisible, $label_str, $btn_id, $btn_event, $btn_str)
	{
		$d_id = (($div_id && $div_id != "") ? " id=\"".$div_id."\"" : "");
		$disp = ($isVisible ? "" : " style=\"display: none;\"");
		$b_id = (($btn_id && $btn_id != "") ? " id=\"".$btn_id."\"" : "");
		$b_ev = (($btn_event && $btn_event != "") ? " onclick=\"".$btn_event."\"" : "");

		html_op("<div".$d_id.$disp.">");
			if ($label_str && $label_str != "")
				html("<span>".$label_str."</span>");
			html_op("<div>");
				html("<button".$b_id." class=\"dashed_btn resbal_btn\" type=\"button\"".$b_ev."><span>".$btn_str."</span></button>");
			html_cl("</div>");
		html_cl("</div>");
	}


	define("ICON_LINK", 1, TRUE);
	define("ICON_BUTTON", 2, TRUE);

	// Return amrkup for icon link element
	function getIconLink($il_type, $div_id, $iconClass, $text, $isVisible, $action = "")
	{
		$resStr = "";

		if ($il_type != ICON_LINK && $il_type != ICON_BUTTON)
			return $resStr;

		$d_id = (($div_id && $div_id != "") ? " id=\"".$div_id."\"" : "");
		$disp = ($isVisible ? "" : " style=\"display: none;\"");

		$resStr .= "<div".$d_id." class=\"iconlink\"".$disp.">";

		if ($il_type == ICON_LINK)
		{
			$il_href = ($action && $action != "") ? " href=\"".$action."\"" : "";

			$resStr .= "<a".$il_href.">";
		}
		else if ($il_type == ICON_BUTTON)
		{
			$il_click = ($action && $action != "") ? " onclick=\"".$action."\"" : "";
			$resStr .= "<button".$il_click.">";
		}

		$il_icon = ($iconClass && $iconClass != "") ? " class=\"".$iconClass."\"" : "";
		$resStr .= "<div".$il_icon."></div>";
		$resStr .= "<span>".$text."</span>";

		$resStr .= ($il_type == ICON_BUTTON) ? "</button>" : "</a>";
		$resStr .= "</div>";

		return $resStr;
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