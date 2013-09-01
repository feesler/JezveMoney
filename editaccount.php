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
	html(getJS("common.js"));
	html(getJS("main.js"));
	html("<script>");
	echo(Currency::getArray());
	html("</script>");

	html("</head>");
	html("<body>");

	require_once("./templates/header.php");

	html("<form method=\"post\" action=\"./modules/editaccount.php\" onsubmit=\"return onNewAccountSubmit(this);\">");
	html("<input id=\"accid\" name=\"accid\" type=\"hidden\" value=\"".$acc_id."\">");
	html_op("<div class=\"form_content acc_content\">");
		html_op("<div class=\"content_wrap\">");
			html("<h2>Edit account</h2>");
			html_op("<div>");
				html_op("<div class=\"non_float\">");
					html("<label for=\"accname\">Account name</label>");
					html("<div class=\"stretch_input std_input\"><div><input id=\"accname\" name=\"accname\" type=\"text\" value=\"".$acc_name."\"></div></div>");
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
								html("<input class=\"summ_text\" id=\"balance\" name=\"balance\" type=\"text\" value=\"".$acc_bal."\">");
							html_cl("</div>");
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