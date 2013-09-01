<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/person.php");

	$user_id = User::check();
	if (!$user_id)
		setLocation("./login.php");

	$action = "";
	if (isset($_GET["act"]))
	{
		if ($_GET["act"] == "changepassword" || $_GET["act"] == "changename")
			$action = $_GET["act"];
		else
			setLocation("./profile.php");
	}

	$user_name = User::getName($user_id);

	$person_name = "";
	$owner_id = User::getOwner($user_id);

	$person = new Person($user_id);

	$person_name = $person->getName($owner_id);

	$titleString = "Jezve Money | Profile";
	if ($action == "changename")
		$titleString .= " | Change name";
	else if ($action == "changepassword")
		$titleString .= " | Change password";

	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");

	html(getCommonHeaders());

	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("login.css"));
	html(getJS("common.js"));
	html(getJS("main.js"));

	html("<script>");
	html("var p_name = ".json_encode($person_name).";");
	html("</script>");

	html("</head>");
	html("<body>");

	require_once("./templates/header.php");

	html_op("<div class=\"form_content\">");
		html_op("<div class=\"profile_summary\">");
			html("<h1>User profile</h1>");
			html_op("<div>");
				html("<h2>Account name</h2>");
				html("<span>".$user_name."</span>");
			html_cl("</div>");

			html();
			html_op("<div>");
				html("<h2>User name</h2>");
				html("<span>".$person_name."</span>");

			if ($action != "changename")
			{
				html("<div><a href=\"./profile.php?act=changename\">Change</a></div>");
			}

			html_cl("</div>");

			if ($action != "changepassword")
			{
				html();
				html_op("<div>");
					html("<h2>Security</h2>");
					html("<div><a href=\"./profile.php?act=changepassword\">Change password</a></div>");
				html_cl("</div>");
			}

		html_cl("</div>");

	if ($action == "changepassword")
	{
		html("<form method=\"post\" action=\"./modules/changepassword.php\" onsubmit=\"return onChangePassSubmit(this);\">");
		html_op("<div class=\"content_wrap\">");
			html("<h2>Change password</h2>");
			html_op("<div>");
				html_op("<div class=\"non_float\">");
					html("<label for=\"oldpwd\">Current password</label>");
					html("<div class=\"stretch_input profile_input\"><div><input id=\"oldpwd\" name=\"oldpwd\" type=\"password\"></div></div>");
				html_cl("</div>");

				html_op("<div class=\"non_float\">");
					html("<label for=\"newpwd\">New password</label>");
					html("<div class=\"stretch_input profile_input\"><div><input id=\"newpwd\" name=\"newpwd\" type=\"password\"></div></div>");
				html_cl("</div>");

				html("<div class=\"profile_controls\"><input class=\"btn ok_btn\" type=\"submit\" value=\"ok\"><a class=\"btn cancel_btn\" href=\"./profile.php\">cancel</a></div>");
			html_cl("</div>");
		html_cl("</div>");
		html("</form>");
	}
	else if ($action == "changename")
	{
		html("<form method=\"post\" action=\"./modules/changename.php\" onsubmit=\"return onChangeNameSubmit(this);\">");
		html_op("<div class=\"content_wrap\">");
			html("<h2>Change name</h2>");
			html_op("<div>");
				html("<label for=\"newpwd\">New name</label>");
				html("<div class=\"stretch_input profile_input\"><div><input id=\"newname\" name=\"newname\" type=\"text\"></div></div>");
				html("<div class=\"profile_controls\"><input class=\"btn ok_btn\" type=\"submit\" value=\"ok\"><a class=\"btn cancel_btn\" href=\"./profile.php\">cancel</a></div>");
			html_cl("</div>");
		html_cl("</div>");
		html("</form>");
	}

	html_cl("</div>");
	html("</body>");
	html("</html>");
?>