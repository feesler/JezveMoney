<?php
	
	// Set location header to redirect page and exit from script
	function setLocation($loc)
	{
		header("Location: ".$loc);
		exit();
	}


	$classes = array("CachedTable" => "class/cachedTable.php",
					"Account" => "class/account.php",
					"Currency" => "class/currency.php",
					"Debt" => "class/debt.php",
					"Currency" => "class/currency.php",
					"mysqlDB" => "class/mysql.php",
					"Person" => "class/person.php",
					"Transaction" => "class/transaction.php",
					"User" => "class/user.php");

	// Check class name and try to load file
	function autoLoadClass($className)
	{
		global $docroot, $rootdir, $classes;

		foreach($classes as $clName => $clPath)
		{
			if ($clName == $className)
			{
				require($docroot.$rootdir.$clPath);
				break;
			}
		}
	}


	// Check string is not null and not empty
	function is_empty($str)
	{
		return is_null($str) || $str == "";
	}


	// Return string for common headers
	function getCommonHeaders()
	{
		$resStr = "";

		$resStr .= "<meta http-equiv=\"content-type\" content=\"text/html; charset=utf-8\">\r\n";
		$resStr .= "<meta name=\"viewport\" content=\"width=device-width,maximum-scale=1,initial-scale=1,user-scalable=0\">";
		$resStr .= "<link rel=\"shortcut icon\" href=\"./favicon.ico\" type=\"image/x-icon\">";

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
	function getTile($tile_type, $tile_id, $tile_title, $tile_subtitle, $tile_action = "", $add_class = "")
	{
		$resStr = "";

		if ($tile_type != STATIC_TILE && $tile_type != LINK_TILE && $tile_type != BUTTON_TILE)
			return $resStr;

		$t_id = ($tile_id && $tile_id != "") ? " id=\"".$tile_id."\"" : "";
		$t_class = "tile".(($add_class && $add_class != "") ? " ".$add_class : "");

		$resStr .= "<div".$t_id." class=\"".$t_class."\">";
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
			$resStr .= "<button class=\"tilelink\"".$t_click." type=\"button\">";
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

	// Return markup for icon link element
	function getIconLink($il_type, $div_id, $iconClass, $text, $isVisible, $action = "", $add_class = "", $addText = "")
	{
		$resStr = "";

		if ($il_type != ICON_LINK && $il_type != ICON_BUTTON)
			return $resStr;

		$d_id = (($div_id && $div_id != "") ? " id=\"".$div_id."\"" : "");
		$disp = ($isVisible ? "" : " style=\"display: none;\"");
		$il_class = "iconlink".(($add_class && $add_class != "") ? " ".$add_class : "");

		$resStr .= "<div".$d_id." class=\"".$il_class."\"".$disp.">";

		if ($il_type == ICON_LINK)
		{
			$il_href = ($action && $action != "") ? " href=\"".$action."\"" : "";

			$resStr .= "<a".$il_href.">";
		}
		else if ($il_type == ICON_BUTTON)
		{
			$il_click = ($action && $action != "") ? " onclick=\"".$action."\"" : "";
			$resStr .= "<button".$il_click." type=\"button\">";
		}

		$il_icon = ($iconClass && $iconClass != "") ? " class=\"icon ".$iconClass."\"" : "";
		$resStr .= "<div".$il_icon."></div>";

		if ($text && $text != "")
		{
			$resStr .= "<div class=\"icontitle\">";
			if ($addText && $addText != "")
			{
				$resStr .= "<span class=\"maintitle\">".$text."</span><br>";
				$resStr .= "<span class=\"addtitle\">".$addText."</span>";
			}
			else
			{
				$resStr .= "<span>".$text."</span>";
			}
			$resStr .= "</div>";
		}

		$resStr .= ($il_type == ICON_BUTTON) ? "</button>" : "</a>";
		$resStr .= "</div>";

		return $resStr;
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

		$chargeArr = array();
		$groupArr = array();
		$sumDate = NULL;
		$curDate = NULL;
		$prevDate = NULL;
		$curSum = 0.0;
		$itemsInGroup = 0;
		$trans_time = 0;

		$fields = "tr.date AS date, tr.charge AS charge";
		$tables = "transactions AS tr";
		$cond =  "tr.user_id=".$user_id." AND tr.type=".$trans_type;

		if ($byCurrency)
		{
			$tables .= ", accounts AS a";
			$cond .= " AND a.curr_id=".$curr_acc_id;
			if ($trans_type == 1)			// expense or transfer
				$cond .= " AND tr.src_id=a.id";
			else if ($trans_type == 2)		// income
				$cond .= " AND tr.dest_id=a.id";
		}
		else
		{
			if ($trans_type == 1)			// expense or transfer
				$cond .= " AND tr.src_id=".$curr_acc_id;
			else if ($trans_type == 2)		// income
				$cond .= " AND tr.dest_id=".$curr_acc_id;
		}

		$resArr = $db->selectQ($fields, $tables, $cond, NULL, "pos ASC");
		foreach($resArr as $row)
		{
			$trans_time = strtotime($row["date"]);
			$dateInfo = getdate($trans_time);
			$itemsInGroup++;

			if ($group_type == 0)		// no grouping
			{
				$chargeArr[] = floatval($row["charge"]);

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
				$chargeArr[] = $curSum;
				$curSum = 0.0;
				$groupArr[] = array(date("d.m.Y", $trans_time), 1);
			}

			$curSum += floatval($row["charge"]);
		}

		// save remain value
		if ($group_type != 0 && $curSum != 0.0)
		{
			if ($sumDate != NULL && $sumDate != $curDate)
			{
				$chargeArr[] = $curSum;
				$groupArr[] = array(date("d.m.Y", $trans_time), 1);
			}
			else
			{
				if (!count($chargeArr))
					$chargeArr[] = $curSum;
				else
					$chargeArr[count($chargeArr) - 1] += $curSum;
				if (!count($groupArr))
					$groupArr[] = array(date("d.m.Y", $trans_time), 1);
				else if ($group_type == 0)
					$groupArr[count($groupArr) - 1][1]++;
			}
		}

		if ($limit > 0)
		{
			$chargeCount = count($chargeArr);
			$limitCount = min($chargeCount, $limit);
			$chargeArr = array_slice($chargeArr, -$limitCount);

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

		return array($chargeArr, $groupArr);
	}


	// Return markup for transaction type menu
	function showSubMenu($cmp_val, $menuArr)
	{
		if (!is_array($menuArr))
			return;

		html_op("<div id=\"trtype_menu\" class=\"subHeader\">");
			forEach($menuArr as $menuItem)
			{
				if (!is_array($menuItem))
					break;

				$resStr = "<span>";
				if ($menuItem[0] == $cmp_val)
					$resStr .= "<b>".$menuItem[1]."</b>";
				else
					$resStr .= "<a href=\"".$menuItem[2]."\">".$menuItem[1]."</a>";
				$resStr .= "</span>";
				html($resStr);
			}
		html_cl("</div>");
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

?>