﻿<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/person.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");
	require_once("./class/transaction.php");


	// Print markup for submenu
	function showSubMenu()
	{
		global $trans_type, $acc_id;

		$acc_id = 0;
		if (isset($_GET["acc_id"]))
			$acc_id = intval($_GET["acc_id"]);

		$acc_par = (($acc_id != 0) ? "&amp;acc_id=".$acc_id : "");

		html_op("<div class=\"subHeader\">");

			$resStr = "<span>";
			$resStr .= (($trans_type == 0) ? "<b>" : "<a href=\"./transactions.php?type=all".$acc_par."\">");
			$resStr .= "All";
			$resStr .= (($trans_type == 0) ? "</b>" : "</a>");
			$resStr .= "</span>";
			html($resStr);

			$resStr = "<span>";
			$resStr .= (($trans_type == 1) ? "<b>" : "<a href=\"./transactions.php?type=expense".$acc_par."\">");
			$resStr .= "Expense";
			$resStr .= (($trans_type == 1) ? "</b>" : "</a>");
			$resStr .= "</span>";
			html($resStr);

			$resStr = "<span>";
			$resStr .= (($trans_type == 2) ? "<b>" : "<a href=\"./transactions.php?type=income".$acc_par."\">");
			$resStr .= "Income";
			$resStr .= (($trans_type == 2) ? "</b>" : "</a>");
			$resStr .= "</span>";
			html($resStr);

			$resStr = "<span>";
			$resStr .= (($trans_type == 3) ? "<b>" : "<a href=\"./transactions.php?type=transfer".$acc_par."\">");
			$resStr .= "Transfer";
			$resStr .= (($trans_type == 3) ? "</b>" : "</a>");
			$resStr .= "</span>";
			html($resStr);

			$resStr = "<span>";
			$resStr .= (($trans_type == 4) ? "<b>" : "<a href=\"./transactions.php?type=debt".$acc_par."\">");
			$resStr .= "Debt";
			$resStr .= (($trans_type == 4) ? "</b>" : "</a>");
			$resStr .= "</span>";
			html($resStr);

		html_cl("</div>");
	}


	$user_id = User::check();
	if (!$user_id)
		setLocation("./login.php");

	$trans = new Transaction($user_id);

	$type_str = (isset($_GET["type"])) ? $_GET["type"] : "all";

	$trans_type = Transaction::getStringType($type_str);
	if (is_null($trans_type))
		fail();

	$page_num = (isset($_GET["page"]) && is_numeric($_GET["page"])) ? (intval($_GET["page"]) - 1) : 0;

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
	html(getCSS("transaction.css"));
	html(getCSS("table.css"));
	html(getCSS("popup.css"));
	html(getJS("common.js"));
	html(getJS("popup.js"));
	html(getJS("tr_list.js"));

	html("<script>");
	pushTab();
		html("var transType = ".json_encode($type_str).";");
		html("var curAccId = ".json_encode($acc_id).";");
	popTab();
	html("</script>");

	html("</head>");
	html("<body>");

	require_once("./templates/header.php");

	html_op("<div class=\"trans_cont\">");
		html_op("<div>");
			html_op("<div class=\"heading\">");
				html("<h1>Transactions</h1>");
				html("<div id=\"add_btn\" class=\"iconlink\"><a href=\"./newtransaction.php\"><div class=\"add\"></div><span>New</span></a></div>");
			html_cl("</div>");

			html_op("<div>");
				showSubMenu();
				$trans->getTable($trans_type, $acc_id, TRUE, 10, $page_num);
			html_cl("</div>");

			html_op("<div class=\"control_icons\">");
				html("<div id=\"edit_btn\" class=\"iconlink\" style=\"display: none;\"><a href=\"#\"><div class=\"edit\"></div><span>Edit</span></a></div>");
				html("<div id=\"del_btn\" class=\"iconlink\" style=\"display: none;\"><button onclick=\"showDeletePopup();\"><div class=\"del\"></div><span>Delete</span></button></div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");
	html_cl("</div>");
	html("<form id=\"delform\" method=\"post\" action=\"./modules/deltransaction.php\">");
	html("<input id=\"deltrans\" name=\"transactions\" type=\"hidden\" value=\"\">");
	html("</form>");
	html("</body>");
	html("</html>");
