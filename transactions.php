<?php
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
	$acc = new Account($user_id);

	$type_str = (isset($_GET["type"])) ? $_GET["type"] : "all";

	$trans_type = Transaction::getStringType($type_str);
	if (is_null($trans_type))
		fail();

	$page_num = (isset($_GET["page"]) && is_numeric($_GET["page"])) ? (intval($_GET["page"]) - 1) : 0;

	$acc_id = (isset($_GET["acc_id"])) ? intval($_GET["acc_id"]) : 0;
	if ($acc_id && !$acc->is_exist($acc_id))
		$acc_id = 0;

	$searchReq = (isset($_GET["search"]) ? $_GET["search"] : null);


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
		html("var searchRequest = ".json_encode($searchReq).";");
	popTab();
	html("</script>");

	html("</head>");
	html("<body>");

	require_once("./templates/header.php");

	html_op("<div class=\"content\">");
		html_op("<div class=\"content_wrap\">");
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

				html("<form method=\"get\" action=\"./transactions.php\" onsubmit=\"return onSearchSubmit(this);\">");
				html_op("<div class=\"search_input std_input\">");
					html_op("<div>");
						html("<input id=\"search\" name=\"search\" type=\"text\" value=\"".(is_null($searchReq) ? "" : $searchReq)."\">");
						html("<input class=\"btn search_btn\" type=\"submit\" value=\"Search\">");
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

				$trans->getTable($trans_type, $acc_id, TRUE, 10, $page_num, TRUE, TRUE, $searchReq);
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