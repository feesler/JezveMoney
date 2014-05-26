<?php
	require_once("./setup.php");


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("./login.php");

	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
		fail();

	$acc_id = intval($_GET["id"]);

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

	if (!$acc->is_exist($acc_id))
		fail();

	$acc_name = $acc->getName($acc_id);
	$acc_curr = $acc->getCurrency($acc_id);
	$acc_bal = $acc->getInitBalance($acc_id);
	$acc_icon = $acc->getIcon($acc_id);

	$curr_sign = Currency::getSign($acc_curr);

	$titleString = "Jezve Money | Edit account";

	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");

	html(getCommonHeaders());

	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("tiles.css"));
	html(getCSS("iconlink.css"));
	html(getCSS("ddlist.css"));
	html(getCSS("popup.css"));
	html(getJS("common.js"));
	html(getJS("ready.js"));
	html(getJS("popup.js"));
	html(getJS("currency.js"));
	html(getJS("account.js"));
	html(getJS("ddlist.js"));
	html(getJS("main.js"));
	html("<script>");
	echo(Currency::getArray(TRUE));
	html("var account_id = ".$acc_id.";");
	html("var acc_name = ".json_encode($acc_name).";");
	html("var acc_currency = ".$acc_curr.";");
	html("var acc_balance = ".$acc_bal.";");
	if (isMessageSet())
		html("onReady(initMessage);");
	html("onReady(initControls);");
	html("</script>");

	html("</head>");
	html("<body>");

	html("<form method=\"post\" action=\"./modules/editaccount.php\" onsubmit=\"return onNewAccountSubmit(this);\">");
	html("<input id=\"accid\" name=\"accid\" type=\"hidden\" value=\"".$acc_id."\">");

	html_op("<div class=\"page\">");
		html_op("<div class=\"page_wrapper\">");

	require_once("./templates/header.php");

		html_op("<div class=\"container centered\">");
	html_op("<div class=\"content\">");
		html_op("<div class=\"content_wrap\">");
			html_op("<div class=\"heading h2_heading\">");
				html("<h2>Edit account</h2>");
				html(getIconLink(ICON_BUTTON, "del_btn", "del", "Delete", TRUE, "onDelete();"));
			html_cl("</div>");

			html_op("<div>");
				html_op("<div class=\"non_float std_margin\">");
					html($acc->getTile(BUTTON_TILE, $acc_id, "acc_tile"));
				html_cl("</div>");

				html_op("<div class=\"non_float std_margin\">");
					html("<label for=\"icon\">Icon</label>");
					html_op("<div class=\"std_input\">");
						html_op("<div>");
							html_op("<select id=\"icon\" name=\"icon\" onchange=\"onChangeIcon(this);\">");
								echo($acc->getIconsList($acc_icon));
							html_cl("</select>");
						html_cl("</div>");
					html_cl("</div>");
				html_cl("</div>");

				html_op("<div class=\"non_float std_margin\">");
					html("<label for=\"accname\">Account name</label>");
					html("<div class=\"stretch_input std_input\"><div><input id=\"accname\" name=\"accname\" type=\"text\" value=\"".$acc_name."\" oninput=\"return onAccNameInput(this);\"></div></div>");
				html_cl("</div>");

				html_op("<div class=\"non_float std_margin\">");
					html("<label for=\"currency\">Currency</label>");
					html_op("<div class=\"std_input\">");
						html_op("<div>");
							html_op("<select id=\"currency\" name=\"currency\" onchange=\"onChangeAccountCurrency(this);\">");
								echo(Currency::getList($acc_curr));
							html_cl("</select>");
						html_cl("</div>");
					html_cl("</div>");
				html_cl("</div>");

				html_op("<div class=\"non_float std_margin\">");
					html("<label for=\"balance\">Initial balance</label>");
					html_op("<div>");
						html("<div class=\"curr_container\"><div class=\"btn rcurr_btn inact_rbtn\"><div id=\"currsign\">".$curr_sign."</div></div></div>");
						html_op("<div class=\"stretch_input std_input\">");
							html_op("<div>");
								html("<input class=\"summ_text\" id=\"balance\" name=\"balance\" type=\"text\" value=\"".$acc_bal."\" oninput=\"return onAccBalanceInput(this);\">");
							html_cl("</div>");
						html_cl("</div>");
					html_cl("</div>");
				html_cl("</div>");

				html("<div class=\"acc_controls\"><input class=\"btn ok_btn\" type=\"submit\" value=\"ok\"><a class=\"btn cancel_btn\" href=\"./accounts.php\">cancel</a></div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

	html("</form>");

	html("<form id=\"delform\" method=\"post\" action=\"./modules/delaccount.php\">");
	html("<input name=\"accounts\" type=\"hidden\" value=\"".$acc_id."\">");
	html("</form>");

	html("</body>");
	html("</html>");
?>