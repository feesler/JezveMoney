<?php
	require_once("./setup.php");


	function fail()
	{
		setLocation("./index.php");
		exit();
	}


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("./login.php");

	$trans = new Transaction($user_id);
	$acc = new Account($user_id);
	$curr = new Currency();

	$byCurrency = (isset($_GET["filter"]) && $_GET["filter"] == "currency");

	$type_str = (isset($_GET["type"])) ? $_GET["type"] : "expense";

	$trans_type = Transaction::getStringType($type_str);
	if (is_null($trans_type))
		fail();

	if ($byCurrency)
	{
		if (isset($_GET["curr_id"]) && is_numeric($_GET["curr_id"]))
		{
			$curr_id = intval($_GET["curr_id"]);
			if (!$curr->is_exist($curr_id))
				fail();
		}
		else		// try to get first currency
		{
			$curr_id = Currency::getIdByPos(0);
			if (!$curr_id)
				fail();
		}
		$curr_acc_id = $curr_id;
	}
	else
	{
		if (isset($_GET["acc_id"]) && is_numeric($_GET["acc_id"]))
		{
			$acc_id = intval($_GET["acc_id"]);
			if (!$acc->is_exist($acc_id))
				fail();
		}
		else		// try to get first account of user
		{
			$acc_id = $acc->getIdByPos(0);
			if (!$acc_id)
				fail();
		}
		$curr_acc_id = $acc_id;
	}

	$stDate = (isset($_GET["stdate"]) ? $_GET["stdate"] : NULL);
	$endDate = (isset($_GET["enddate"]) ? $_GET["enddate"] : NULL);

	$dateFmt = "";
	if (!is_null($stDate) && !is_null($endDate))
	{
		$sdate = strtotime($stDate);
		$edate = strtotime($endDate);
		if ($sdate != -1 && $edate != -1)
			$dateFmt = date("d.m.Y", $sdate)." - ".date("d.m.Y", $edate);
	}

	$groupTypes = array("None", "Day", "Week", "Month", "Year");

	$groupType = NULL;
	$groupType_id = 0;
	if (isset($_GET["group"]))
	{
		foreach($groupTypes as $val => $grtype)
		{
			if (strtolower($_GET["group"]) == strtolower($grtype))
			{
				$groupType_id = $val;
				break;
			}
		}

		if ($groupType_id != 0)
			$groupType = strtolower($groupTypes[$groupType_id]);
	}

	$titleString = "Jezve Money | Statistics";

	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");

	html(getCommonHeaders());

	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("iconlink.css"));
	html(getCSS("popup.css"));
	html(getCSS("calendar.css"));
	html(getCSS("statistics.css"));
	html(getJS("common.js"));
	html(getJS("currency.js"));
	html(getJS("ready.js"));
	html(getJS("calendar.js"));
	html(getJS("raphael.js"));
	html(getJS("statistics.js"));

	html_op("<script>");
		echo(Currency::getArray(TRUE));
		html("var accCurr = ".(($byCurrency) ? $curr_id : $acc->getCurrency($acc_id)).";");
		html("var transArr = ".f_json_encode($trans->getArray($trans_type, $acc_id, TRUE, 10, $page_num, $searchReq, $stDate, $endDate)).";");
		$acc = new Account($user_id);	// fix cache of accounts
		html("var transType = ".json_encode($type_str).";");
		html("var groupType = ".json_encode($groupType).";");
		html("var curAccId = ".json_encode($acc_id).";");
		html("var chartData = ".json_encode(getStatArray($user_id, $byCurrency, $curr_acc_id, $trans_type, $groupType_id)).";");
		html();
		html("onReady(initBarChart);");
	html_cl("</script>");

	html("</head>");
	html("<body>");

	require_once("./templates/header.php");

	html_op("<div class=\"content\">");
		html_op("<div class=\"content_wrap\">");
			html_op("<div class=\"heading\">");
				html("<h1>Statistics</h1>");
			html_cl("</div>");

			html_op("<div>");
				$acc_par = (($acc_id != 0) ? "&amp;acc_id=".$acc_id : "");
				$transMenu = array(array(0, "All", "./statistics.php?type=all".$acc_par),
										array(1, "Expense", "./statistics.php?type=expense".$acc_par),
										array(2, "Income", "./statistics.php?type=income".$acc_par),
										array(3, "Transfer", "./statistics.php?type=transfer".$acc_par),
										array(4, "Debt", "./statistics.php?type=debt".$acc_par));
				showSubMenu($trans_type, $transMenu);

				html_op("<div class=\"tr_filter std_input filter_sel\">");
					html_op("<div>");
						html_op("<select id=\"filter_type\" onchange=\"onFilterChange(this);\">");
							html("<option value=\"0\"".(($byCurrency) ? "" : " selected").">Accounts</option>");
							html("<option  value=\"1\"".(($byCurrency) ? " selected" : "").">Currencies</option>");
						html_cl("</select>");
					html_cl("</div>");
				html_cl("</div>");

				$disp = ($byCurrency) ? " style=\"display: none;\"" : "";
				html_op("<div id=\"acc_block\" class=\"tr_filter std_input\"".$disp.">");
					html_op("<div>");
						html_op("<select id=\"acc_id\" onchange=\"onAccountChange(this);\">");
							echo($acc->getList($acc_id));
						html_cl("</select>");
					html_cl("</div>");
				html_cl("</div>");

				$disp = ($byCurrency) ? "" : " style=\"display: none;\"";
				html_op("<div id=\"curr_block\" class=\"tr_filter std_input\"".$disp.">");
					html_op("<div>");
						html_op("<select id=\"curr_id\" onchange=\"onCurrChange(this);\">");
							echo(Currency::getList($curr_id));
						html_cl("</select>");
					html_cl("</div>");
				html_cl("</div>");

				html_op("<div class=\"tr_filter std_input group_filter\">");
					html_op("<div>");
						html_op("<select id=\"groupsel\" onchange=\"onGroupChange();\">");
						foreach($groupTypes as $val => $grtype)
						{
							html("<option value=\"".$val."\"".(($val == $groupType_id) ? " selected" : "").">".$grtype."</option>");
						}
						html_cl("</select>");
					html_cl("</div>");
				html_cl("</div>");

				html_op("<div class=\"tr_filter date_filter\">");
					html(getIconLink(ICON_BUTTON, "calendar_btn", "calendar", "Select range", TRUE, "showCalendar();", "form_iconlink", (is_empty($dateFmt) ? NULL : $dateFmt)));
					html_op("<div id=\"date_block\" style=\"display: none;\">");
						html_op("<div>");
							html_op("<div class=\"right_float\">");
								html("<button id=\"cal_rbtn\" class=\"btn icon_btn cal_btn\" type=\"button\" onclick=\"showCalendar();\"><div></div></button>");
							html_cl("</div>");
							html_op("<div class=\"stretch_input rbtn_input\">");
								html_op("<div>");
									html("<input id=\"date\" name=\"date\" type=\"text\" value=\"".$dateFmt."\">");
								html_cl("</div>");
							html_cl("</div>");
							html("<div id=\"calendar\" class=\"calWrap transCalWrap\" style=\"display: none;\"></div>");
						html_cl("</div>");
					html_cl("</div>");
				html_cl("</div>");

				html_op("<div class=\"charts\">");
					html_op("<div class=\"right_float\">");
						html("<div id=\"vert_labels\"></div>");
					html_cl("</div>");
					html_op("<div class=\"chart_wrap\">");
						html_op("<div class=\"chart_content\">");
							html("<div id=\"chart\"></div>");
						html_cl("</div>");
					html_cl("</div>");
					html("<div id=\"chpopup\" class=\"chart_popup\" style=\"display: none;\"></div>");
				html_cl("</div>");

			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");
	html_cl("</div>");
	html("</body>");
	html("</html>");
?>