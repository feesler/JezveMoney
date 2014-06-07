﻿<?php
	require_once("./setup.php");


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("./login.php");

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

	$curr_id = Currency::getIdByPos(0);
	$curr_sign = Currency::getSign($curr_id);
	$acc_name = "New account";
	$acc_bal = 0.0;

	$titleString = "Jezve Money | New account";

	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");
	html(getCommonHeaders());

	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("iconlink.css"));
	html(getCSS("ddlist.css"));
	html(getCSS("tiles.css"));
	html(getJS("common.js"));
	html(getJS("ready.js"));
	html(getJS("currency.js"));
	html(getJS("account.js"));
	html(getJS("ddlist.js"));
	html(getJS("main.js"));
	html("<script>");
	echo(Currency::getArray(TRUE));
	html("var acc_name = ".json_encode($acc_name).";");
	html("var acc_currency = ".$curr_id.";");
	html("var acc_balance = ".$acc_bal.";");
	if (isMessageSet())
		html("onReady(initMessage);");
	html("onReady(initControls);");
	html("</script>");

	html("</head>");
	html("<body>");

	html("<form method=\"post\" action=\"./modules/createaccount.php\" onsubmit=\"return onNewAccountSubmit(this);\">");

	html_op("<div class=\"page\">");
		html_op("<div class=\"page_wrapper\">");

	require_once("./templates/header.php");

		html_op("<div class=\"container centered\">");
	html_op("<div class=\"content\">");
		html_op("<div class=\"content_wrap\">");
			html("<h2>Create new account</h2>");
			html_op("<div>");
				html_op("<div class=\"non_float std_margin\">");
					html(getTile(BUTTON_TILE, "acc_tile", "New account", Currency::format($acc_bal, $curr_id), "", ""));
				html_cl("</div>");

				html_op("<div class=\"non_float std_margin\">");
					html("<label for=\"icon\">Icon</label>");
					html_op("<div class=\"std_input\">");
						html_op("<div>");
							html_op("<select id=\"icon\" name=\"icon\" onchange=\"onChangeIcon(this);\">");
								echo($acc->getIconsList());
							html_cl("</select>");
						html_cl("</div>");
					html_cl("</div>");
				html_cl("</div>");

				html_op("<div class=\"non_float std_margin\">");
					html("<label for=\"accname\">Account name</label>");
					html("<div class=\"stretch_input std_input\"><div><input id=\"accname\" name=\"accname\" type=\"text\" oninput=\"return onAccNameInput(this);\"></div></div>");
				html_cl("</div>");

				html_op("<div class=\"non_float std_margin\">");
					html("<label for=\"currency\">Currency</label>");
					html_op("<div class=\"std_input\">");
						html_op("<div>");
							html_op("<select id=\"currency\" name=\"currency\" onchange=\"onChangeAccountCurrency(this);\">");
								echo(Currency::getList());
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
								html("<input class=\"summ_text\" id=\"balance\" name=\"balance\" type=\"text\" value=\"0\" oninput=\"return onAccBalanceInput(this);\">");
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
	html("</body>");
	html("</html>");
?>