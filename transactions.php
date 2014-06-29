<?php
	require_once("./setup.php");


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("./login.php");

	$trans = new Transaction($user_id);
	$acc = new Account($user_id);

	$type_str = (isset($_GET["type"])) ? $_GET["type"] : "all";

	$trans_type = Transaction::getStringType($type_str);
	if (is_null($trans_type))
		fail();

	$page_num = (isset($_GET["page"]) && is_numeric($_GET["page"])) ? (intval($_GET["page"]) - 1) : 0;

	$acc_id = (isset($_GET["acc_id"])) ? intval($_GET["acc_id"]) : 0;
	if ($acc_id && !$acc->is_exist($acc_id))
		$acc_id = 0;

	$searchReq = (isset($_GET["search"]) ? $_GET["search"] : NULL);

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

	$showDetails = FALSE;
	if (isset($_GET["mode"]) && $_GET["mode"] == "details")
		$showDetails = TRUE;

	$titleString = "Jezve Money | Transactions";

	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");

	html(getCommonHeaders());

	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("tiles.css"));
	html(getCSS("iconlink.css"));
	html(getCSS("popup.css"));
	html(getCSS("calendar.css"));
	html(getCSS("ddlist.css"));
	html(getCSS("transaction.css"));
	html(getCSS("trlist.css"));
	html(getCSS("popup.css"));
	html(getCSS("toolbar.css"));
	html("<link rel=\"stylesheet\" media=\"all and (min-width: 701px)\" type=\"text/css\" href=\"./css/screen.css\" />");
	html(getJS("common.js"));
	html(getJS("currency.js"));
	html(getJS("account.js"));
	html(getJS("ajax.js"));
	html(getJS("ready.js"));
	html(getJS("calendar.js"));
	html(getJS("popup.js"));
	html(getJS("dragndrop.js"));
	html(getJS("toolbar.js"));
	html(getJS("ddlist.js"));
	html(getJS("tr_list.js"));

	html("<script>");
	pushTab();
		html("var accounts = ".f_json_encode($acc->getArray()).";");
		echo(Currency::getArray(TRUE));
		html("var transArr = ".f_json_encode($trans->getArray($trans_type, $acc_id, TRUE, 10, $page_num, $searchReq, $stDate, $endDate, TRUE)).";");
		$acc = new Account($user_id);	// fix cache of accounts

		html("var transType = ".json_encode($type_str).";");
		html("var curAccId = ".json_encode($acc_id).";");
		html("var searchRequest = ".f_json_encode($searchReq).";");
		html("var detailsMode = ".(($showDetails) ? "true" : "false").";");
		html();
		html("onReady(initTransListDrag);");
		html("onReady(initToolbar);");
	popTab();
	html("</script>");

	html("</head>");
	html("<body>");

	html_op("<div class=\"page\">");
		html_op("<div class=\"page_wrapper\">");

	require_once("./templates/header.php");

		html_op("<div class=\"container centered\">");
	html_op("<div class=\"content\">");
		html_op("<div class=\"content_wrap\">");
			html_op("<div class=\"heading\">");
				html("<h1>Transactions</h1>");
				html(getIconLink(ICON_LINK, "add_btn", "add", "New", TRUE, "./newtransaction.php"));
			html_cl("</div>");

			html_op("<div>");

				$trTypes = array("All", "Expense", "Income", "Transfer", "Debt");
				$transMenu = array();
				$baseUrl = "./transactions.php";
				foreach($trTypes as $ind => $trTypeName)
				{
					$params = array("type" => strtolower($trTypeName));
					if ($acc_id != 0)
						$params["acc_id"] = $acc_id;
					if ($showDetails)
						$params["mode"] = "details";
					
					$transMenu[] = array($ind, $trTypeName, urlJoin($baseUrl, $params));
				}

				showSubMenu($trans_type, $transMenu);

				html("<form method=\"get\" action=\"./transactions.php\" onsubmit=\"return onSearchSubmit(this);\">");
				html_op("<div class=\"search_input std_input\">");
					html_op("<div>");
						html("<input id=\"search\" name=\"search\" type=\"text\" value=\"".(is_null($searchReq) ? "" : $searchReq)."\">");
						html("<button class=\"btn icon_btn search_btn\" type=\"submit\"><div></div></button>");
					html_cl("</div>");
				html_cl("</div>");
				html("</form>");

				html_op("<div class=\"tr_filter std_input\">");
					html_op("<div>");
						html_op("<select id=\"acc_id\" name=\"acc_id\" onchange=\"onAccountChange(this);\">");
							html("<option value=\"0\">All</option>");
							echo($acc->getList($acc_id));
						html_cl("</select>");
					html_cl("</div>");
				html_cl("</div>");

				html_op("<div class=\"tr_filter date_filter\">");
					html(getIconLink(ICON_BUTTON, "calendar_btn", "calendar", "Select range", TRUE, "showCalendar();", "std_margin", (is_empty($dateFmt) ? NULL : $dateFmt)));
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

				$trans->getTable($trans_type, $acc_id, TRUE, 10, $page_num, TRUE, $searchReq, $stDate, $endDate, $showDetails);
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

			html_cl("</div>");
		html_cl("</div>");

		html_op("<div id=\"toolbar\" class=\"sidebar\" style=\"display: none;\">");
			html_op("<div>");
				html_op("<div id=\"tb_content\" class=\"siderbar_content\">");
					html("<div id=\"sbEllipsis\" class=\"sidebar_ellipsis\"></div>");

					html(getIconLink(ICON_LINK, "edit_btn", "icon_white edit", "Edit", FALSE, "#"));
					html(getIconLink(ICON_BUTTON, "del_btn", "icon_white del", "Delete", FALSE, "showDeletePopup();"));
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");

	html_cl("</div>");

	html("<form id=\"delform\" method=\"post\" action=\"./modules/deltransaction.php\">");
	html("<input id=\"deltrans\" name=\"transactions\" type=\"hidden\" value=\"\">");
	html("</form>");
	html("</body>");
	html("</html>");
?>