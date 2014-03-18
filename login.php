<?php
	require_once("./setup.php");


	$u = new User();
	$user_id = $u->check();
	if ($user_id != 0)
		setLocation("./index.php");

	$titleString = "Jezve Money | Log in";


	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");

	html(getCommonHeaders());

	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("login.css"));
	html(getCSS("iconlink.css"));
	html(getJS("common.js"));
	html(getJS("ready.js"));
	html(getJS("main.js"));

	if (isMessageSet())
	{
		html_op("<script>");
			html("onReady(initMessage);");
		html_op("</script>");
	}

	html("</head>");
	html("<body>");

	require_once("./templates/header.php");

	html("<form action=\"./modules/login.php\" method=\"post\" onsubmit=\"return onLoginSubmit(this);\">");
	html_op("<div class=\"page login_page\">");
		html_op("<div class=\"cont\">");
			html_op("<div class=\"box\">");
				html("<h1>Log in</h1>");
				html("<label for=\"login\">Username</label>");
				html("<div class=\"stretch_input std_input\"><div><input id=\"login\" name=\"login\" type=\"text\"></div></div>");
				html("<label for=\"password\">Password</label>");
				html("<div class=\"stretch_input std_input\"><div><input id=\"password\" name=\"password\" type=\"password\"></div></div>");
				html("<div class=\"login_controls\"><input class=\"btn ok_btn\" type=\"submit\" value=\"Log in\"><span class=\"alter_link\"><a href=\"./register.php\">Register</a></span></div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");
	html("</form>");
	html("</body>");
	html("</html>");
?>