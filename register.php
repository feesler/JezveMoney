<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");
	require_once("./class/transaction.php");

	$user_id = User::check();
	if ($user_id != 0)
		setLocation("./index.php");

	$titleString = "Jezve Money | Registration";

	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");

	html(getCommonHeaders());

	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("login.css"));
	html(getJS("common.js"));
	html(getJS("main.js"));

	html("</head>");
	html("<body>");

	require_once("./templates/header.php");

	html("<form action=\"./modules/register.php\" method=\"post\" onsubmit=\"return onLoginSubmit(this);\">");
	html("<div class=\"page register_page\">");
	pushTab();
		html("<div class=\"cont\">");
		pushTab();
			html("<div class=\"box\">");
			pushTab();
				html("<h1>Registration</h1>");
				html("<label for=\"login\">Account name</label>");
				html("<div class=\"stretch_input profile_input\"><div><input id=\"login\" name=\"login\" type=\"text\"></div></div>");
				html("<label for=\"login\">Name</label>");
				html("<div class=\"stretch_input profile_input\"><div><input id=\"name\" name=\"name\" type=\"text\"></div></div>");
				html("<label for=\"password\">Password</label>");
				html("<div class=\"stretch_input profile_input\"><div><input id=\"password\" name=\"password\" type=\"password\"></div></div>");
				html("<div class=\"login_controls\"><input class=\"btn ok_btn\" type=\"submit\" value=\"ok\"><span class=\"alter_link\"><a href=\"./login.php\">Log in</a></span></div>");
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