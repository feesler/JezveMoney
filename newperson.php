<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/person.php");

	$user_id = User::check();
	if (!$user_id)
		setLocation("./login.php");

	$person = new Person($user_id);

	$titleString = "Jezve Money | New person";

	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");
	html(getCommonHeaders());

	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("iconlink.css"));
	html(getCSS("login.css"));
	html(getCSS("tiles.css"));
	html(getJS("common.js"));
	html(getJS("ready.js"));
	html(getJS("persons.js"));

	if (isMessageSet())
	{
		html_op("<script>");
			html("onReady(initMessage);");
		html_op("</script>");
	}

	html("</head>");
	html("<body>");

	require_once("./templates/header.php");

	html("<form method=\"post\" action=\"./modules/createperson.php\" onsubmit=\"return onNewPersonSubmit(this);\">");
	html_op("<div class=\"content acc_content\">");
		html_op("<div class=\"content_wrap\">");
			html("<h2>Create new person</h2>");
			html_op("<div>");
				html_op("<div class=\"non_float\">");
					html("<label for=\"pname\">Person name</label>");
					html("<div class=\"stretch_input std_input\"><div><input id=\"pname\" name=\"pname\" type=\"text\"></div></div>");
				html_cl("</div>");

				html("<div class=\"acc_controls\"><input class=\"btn ok_btn\" type=\"submit\" value=\"ok\"><a class=\"btn cancel_btn\" href=\"./person.php\">cancel</a></div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");
	html("</form>");
	html("</body>");
	html("</html>");
?>