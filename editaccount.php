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

	$curr_sign = Currency::getSign($acc_curr);

	$titleString = "Jezve Money | Edit account";

	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");

	html(getCommonHeaders());

	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("login.css"));
	html(getCSS("tiles.css"));
	html(getCSS("iconlink.css"));
	html(getCSS("popup.css"));
	html(getJS("common.js"));
	html(getJS("popup.js"));
	html(getJS("main.js"));
	html("<script>");
	echo(Currency::getArray(TRUE));
	html("var account_id = ".$acc_id.";");
	html("var acc_name = ".json_encode($acc_name).";");
	html("var acc_currency = ".$acc_curr.";");
	html("var acc_balance = ".$acc_bal.";");
	html("</script>");

	html("</head>");
	html("<body>");

	require_once("./templates/header.php");

	html("<form method=\"post\" action=\"./modules/editaccount.php\" onsubmit=\"return onNewAccountSubmit(this);\">");
	html("<input id=\"accid\" name=\"accid\" type=\"hidden\" value=\"".$acc_id."\">");
	html_op("<div class=\"content acc_content\">");
		html_op("<div class=\"content_wrap\">");
			html_op("<div class=\"heading h2_heading\">");
				html("<h2>Edit account</h2>");
				html(getIconLink(ICON_BUTTON, "del_btn", "del", "Delete", TRUE, "onDelete();"));
			html_cl("</div>");

			html_op("<div>");
				html_op("<div class=\"non_float\">");
					html($acc->getTile(BUTTON_TILE, $acc_id, "acc_tile"));
				html_cl("</div>");

				html_op("<div class=\"non_float\">");
					html("<label for=\"currency\">Icon</label>");
					html_op("<div class=\"std_input\">");
						html_op("<div>");
							html_op("<select id=\"icon\" name=\"icon\" onchange=\"onChangeIcon(this);\">");
								html("<option value=\"0\">No icon</option>");
								html("<option value=\"1\">Purse</option>");
								html("<option value=\"2\">Safe</option>");
								html("<option value=\"3\">Card</option>");
								html("<option value=\"4\">Percent</option>");
								html("<option value=\"5\">Bank</option>");
								html("<option value=\"5\">Cash</option>");
							html_cl("</select>");
						html_cl("</div>");
					html_cl("</div>");
				html_cl("</div>");

				html_op("<div class=\"non_float\">");
					html("<label for=\"accname\">Account name</label>");
					html("<div class=\"stretch_input std_input\"><div><input id=\"accname\" name=\"accname\" type=\"text\" value=\"".$acc_name."\" oninput=\"return onAccNameInput(this);\"></div></div>");
				html_cl("</div>");

				html_op("<div class=\"non_float\">");
					html("<label for=\"currency\">Currency</label>");
					html_op("<div class=\"std_input\">");
						html_op("<div>");
							html_op("<select id=\"currency\" name=\"currency\" onchange=\"onChangeAccountCurrency(this);\">");
								echo(Currency::getList($acc_curr));
							html_cl("</select>");
						html_cl("</div>");
					html_cl("</div>");
				html_cl("</div>");

				html_op("<div class=\"non_float\">");
					html("<label for=\"balance\">Initial balance</label>");
					html_op("<div>");
						html("<div class=\"right_float\"><span id=\"currsign\" class=\"curr_sign\">".$curr_sign."</span></div>");
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
	html("</form>");

	html("<form id=\"delform\" method=\"post\" action=\"./modules/delaccount.php\">");
	html("<input name=\"accounts\" type=\"hidden\" value=\"".$acc_id."\">");
	html("</form>");

	html("</body>");
	html("</html>");
?>