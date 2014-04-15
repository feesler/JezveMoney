<?php
	require_once("./setup.php");


	$u = new User();
	$user_id = $u->check();
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

	html("<form action=\"./modules/register.php\" method=\"post\" onsubmit=\"return onLoginSubmit(this);\">");
	html_op("<div class=\"layer register_layer\">");
		html_op("<div class=\"cont\">");
			html_op("<div class=\"box\">");
				html("<h1>Registration</h1>");
				html("<label for=\"login\">Account name</label>");
				html("<div class=\"stretch_input std_input\"><div><input id=\"login\" name=\"login\" type=\"text\"></div></div>");
				html("<label for=\"login\">Name</label>");
				html("<div class=\"stretch_input std_input\"><div><input id=\"name\" name=\"name\" type=\"text\"></div></div>");
				html("<label for=\"password\">Password</label>");
				html("<div class=\"stretch_input std_input\"><div><input id=\"password\" name=\"password\" type=\"password\"></div></div>");
				html("<div class=\"login_controls\"><input class=\"btn ok_btn\" type=\"submit\" value=\"ok\"><span class=\"alter_link\"><a href=\"./login.php\">Log in</a></span></div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");
	html("</form>");
	html("</body>");
	html("</html>");
?>