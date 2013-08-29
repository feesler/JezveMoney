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
	html("<div class=\"acc_content\">");
	pushTab();
		html("<div class=\"profile_common\">");
		pushTab();
			html("<h2>Create new account</h2>");
			html("<div>");
			pushTab();
				html("<label for=\"accname\">Account name</label>");
				html("<div class=\"rdiv\"><div><input id=\"accname\" name=\"accname\" type=\"text\"></div></div>");
				html("<label for=\"currency\">Currency</label>");
				html("<div class=\"rdiv\">");
				pushTab();
					html("<div>");
					pushTab();
						html("<select id=\"currency\" name=\"currency\" onchange=\"onChangeAccountCurrency(this);\">");
						pushTab();
							echo(Currency::getList());
						popTab();
						html("</select>");
					popTab();
					html("</div>");
				popTab();
				html("</div>");
				html("<label for=\"balance\">Initial balance</label>");
				html("<div>");
				pushTab();
					html("<div class=\"rtext\"><span id=\"currsign\" class=\"curr_sign\">р.</span></div>");
					html("<div class=\"rdiv\">");
					pushTab();
						html("<div>");
						pushTab();
							html("<input class=\"summ_text\" id=\"balance\" name=\"balance\" type=\"text\" value=\"0\">");
						popTab();
						html("</div>");
					popTab();
					html("</div>");
				popTab();
				html("</div>");
				html("<div class=\"acc_controls\"><input class=\"btn ok_btn\" type=\"submit\" value=\"ok\"><a class=\"btn cancel_btn\" href=\"./accounts.php\">cancel</a></div>");
			popTab();
			html("</div>");
		popTab();
		html("</div>");
	popTab();
	html("</div>");
	html("</form>");
	html("</body>");
	html("</html>");
?>