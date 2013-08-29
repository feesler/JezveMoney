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
	html("<div class=\"acc_content\">", PUSH_AFTER);
		html("<div class=\"profile_common\">", PUSH_AFTER);
			html("<h2>Create new account</h2>");
			html("<div>", PUSH_AFTER);
				html("<label for=\"accname\">Account name</label>");
				html("<div class=\"rdiv\"><div><input id=\"accname\" name=\"accname\" type=\"text\"></div></div>");
				html("<label for=\"currency\">Currency</label>");
				html("<div class=\"rdiv\">", PUSH_AFTER);
					html("<div>", PUSH_AFTER);
						html("<select id=\"currency\" name=\"currency\" onchange=\"onChangeAccountCurrency(this);\">", PUSH_AFTER);
							echo(Currency::getList());
						html("</select>", POP_BEFORE);
					html("</div>", POP_BEFORE);
				html("</div>", POP_BEFORE);
				html("<label for=\"balance\">Initial balance</label>");
				html("<div>", PUSH_AFTER);
					html("<div class=\"rtext\"><span id=\"currsign\" class=\"curr_sign\">р.</span></div>");
					html("<div class=\"rdiv\">", PUSH_AFTER);
						html("<div>", PUSH_AFTER);
							html("<input class=\"summ_text\" id=\"balance\" name=\"balance\" type=\"text\" value=\"0\">");
						html("</div>", POP_BEFORE);
					html("</div>", POP_BEFORE);
				html("</div>", POP_BEFORE);
				html("<div class=\"acc_controls\"><input class=\"btn ok_btn\" type=\"submit\" value=\"ok\"><a class=\"btn cancel_btn\" href=\"./accounts.php\">cancel</a></div>");
			html("</div>", POP_BEFORE);
		html("</div>", POP_BEFORE);
	html("</div>", POP_BEFORE);
	html("</form>");
	html("</body>");
	html("</html>");
?>