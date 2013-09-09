﻿<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/person.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");
	require_once("./class/transaction.php");


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
				html(getIconLink(ICON_LINK, "add_btn", "add", "New", TRUE, "./newtransaction.php"));
			html_cl("</div>");

			html_op("<div>");
				$acc_par = (($acc_id != 0) ? "&amp;acc_id=".$acc_id : "");
				$transMenu = array(array(0, "All", "./transactions.php?type=all".$acc_par),
										array(1, "Expense", "./transactions.php?type=expense".$acc_par),
										array(2, "Income", "./transactions.php?type=income".$acc_par),
										array(3, "Transfer", "./transactions.php?type=transfer".$acc_par),
										array(4, "Debt", "./transactions.php?type=debt".$acc_par));
				showSubMenu($trans_type, $transMenu);

				$trans->getTable($trans_type, $acc_id, TRUE, 10, $page_num);
			html_cl("</div>");

			html_op("<div class=\"control_icons\">");
				html(getIconLink(ICON_LINK, "edit_btn", "edit", "Edit", FALSE, "#"));
				html(getIconLink(ICON_BUTTON, "del_btn", "del", "Delete", FALSE, "showDeletePopup();"));
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