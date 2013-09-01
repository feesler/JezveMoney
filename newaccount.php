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

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

	$titleString = "Jezve Money | New account";

	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");
	html(getCommonHeaders());

	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("login.css"));
	html(getCSS("tiles.css"));
	html(getJS("common.js"));
	html(getJS("main.js"));
	html("<script>");
	echo(Currency::getArray());
	html("</script>");

	html("</head>");
	html("<body>");

	require_once("./templates/header.php");

	html("<form method=\"post\" action=\"./modules/createaccount.php\" onsubmit=\"return onNewAccountSubmit(this);\">");
	html_op("<div class=\"acc_content\">");
		html_op("<div class=\"profile_common\">");
			html("<h2>Create new account</h2>");
			html_op("<div>");
				html("<label for=\"accname\">Account name</label>");
				html("<div class=\"rdiv\"><div><input id=\"accname\" name=\"accname\" type=\"text\"></div></div>");
				html("<label for=\"currency\">Currency</label>");
				html_op("<div class=\"rdiv\">");
					html_op("<div>");
						html_op("<select id=\"currency\" name=\"currency\" onchange=\"onChangeAccountCurrency(this);\">");
							echo(Currency::getList());
						html_cl("</select>");
					html_cl("</div>");
				html_cl("</div>");
				html("<label for=\"balance\">Initial balance</label>");
				html_op("<div>");
					html("<div class=\"rtext\"><span id=\"currsign\" class=\"curr_sign\">р.</span></div>");
					html_op("<div class=\"rdiv\">");
						html_op("<div>");
							html("<input class=\"summ_text\" id=\"balance\" name=\"balance\" type=\"text\" value=\"0\">");
						html_cl("</div>");
					html_cl("</div>");
				html_cl("</div>");
				html("<div class=\"acc_controls\"><input class=\"btn ok_btn\" type=\"submit\" value=\"ok\"><a class=\"btn cancel_btn\" href=\"./accounts.php\">cancel</a></div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");
	html("</form>");
	html("</body>");
	html("</html>");
?>