﻿<?php
	require_once("./setup.php");


	$u = new User();
	$user_id = $u->check();
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

	$user_login = $u->getLogin($user_id);

	$person_name = "";
	$owner_id = $u->getOwner($user_id);

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
	html(getCSS("popup.css"));
	html(getCSS("iconlink.css"));
	html(getJS("common.js"));
	html(getJS("ready.js"));
	html(getJS("popup.js"));
	html(getJS("main.js"));

	html("<script>");
	html("var p_name = ".json_encode($person_name).";");
	if (isMessageSet())
		html("onReady(initMessage);");
	html("</script>");

	html("</head>");
	html("<body>");

	html_op("<div class=\"page\">");
		html_op("<div class=\"page_wrapper\">");

	require_once("./templates/header.php");

		html_op("<div class=\"container centered\">");
	html_op("<div class=\"content\">");
		html_op("<div class=\"content_wrap profile_summary\">");
			html("<h1>User profile</h1>");
			html_op("<div>");
				html("<h2>Account name</h2>");
				html("<span>".$user_login."</span>");
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

			html();
			html_op("<div>");
				html("<h2>Reset data</h2>");
				html_op("<div>");
					html("<span>You also may reset all your accounts data.<br>");
					html("<form id=\"resetacc_form\" method=\"post\" action=\"./modules/resetaccounts.php\">");
					html("</form>");
					html("<input class=\"btn ok_btn\" type=\"button\" onclick=\"showResetAccountsPopup();\" value=\"Reset\"></span>");
				html_cl("</div>");
				html_op("<div style=\"margin-top: 15px;\">");
					html("<span>You may also reset all your data and start from the scratch.<br>");
					html("<form id=\"resetall_form\" method=\"post\" action=\"./modules/resetall.php\">");
					html("</form>");
					html("<input class=\"btn ok_btn\" type=\"button\" onclick=\"showResetAllPopup();\" value=\"Reset all\"></span>");
				html_cl("</div>");
			html_cl("</div>");

		html_cl("</div>");

	if ($action == "changepassword")
	{
		html("<form method=\"post\" action=\"./modules/changepassword.php\" onsubmit=\"return onChangePassSubmit(this);\">");
		html_op("<div class=\"content_wrap\">");
			html("<h2>Change password</h2>");
			html_op("<div>");
				html_op("<div class=\"non_float\">");
					html("<label for=\"oldpwd\">Current password</label>");
					html("<div class=\"stretch_input std_input\"><div><input id=\"oldpwd\" name=\"oldpwd\" type=\"password\"></div></div>");
				html_cl("</div>");

				html_op("<div class=\"non_float\">");
					html("<label for=\"newpwd\">New password</label>");
					html("<div class=\"stretch_input std_input\"><div><input id=\"newpwd\" name=\"newpwd\" type=\"password\"></div></div>");
				html_cl("</div>");

				html("<div class=\"acc_controls\"><input class=\"btn ok_btn\" type=\"submit\" value=\"ok\"><a class=\"btn cancel_btn\" href=\"./profile.php\">cancel</a></div>");
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
				html_op("<div class=\"non_float\">");
					html("<label for=\"newpwd\">New name</label>");
					html("<div class=\"stretch_input std_input\"><div><input id=\"newname\" name=\"newname\" type=\"text\"></div></div>");
				html_cl("</div>");

				html("<div class=\"acc_controls\"><input class=\"btn ok_btn\" type=\"submit\" value=\"ok\"><a class=\"btn cancel_btn\" href=\"./profile.php\">cancel</a></div>");
			html_cl("</div>");
		html_cl("</div>");
		html("</form>");
	}

	html_cl("</div>");

			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");
	html("</body>");
	html("</html>");
?>