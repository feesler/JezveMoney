<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/person.php");

	$user_id = User::check();
	if (!$user_id)
		setLocation("./login.php");

	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
		fail();

	$p_id = intval($_GET["id"]);

	$person = new Person($user_id);
	if (!$person->is_exist($p_id) && $person->getUser($p_id) == $user_id)
		fail();

	$pName = $person->getName($p_id);


	$titleString = "Jezve Money | Edit person";

	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");
	html(getCommonHeaders());

	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("login.css"));
	html(getCSS("tiles.css"));
	html(getJS("common.js"));
	html(getJS("persons.js"));

	html("<script>");
	html("var personName = ".json_encode($pName).";");
	html("</script>");

	html("</head>");
	html("<body>");

	require_once("./templates/header.php");

	html("<form method=\"post\" action=\"./modules/editperson.php\" onsubmit=\"return onEditPersonSubmit(this);\">");
	html("<input id=\"pid\" name=\"pid\" type=\"hidden\" value=\"".$p_id."\">");
	html_op("<div class=\"form_content acc_content\">");
		html_op("<div class=\"content_wrap\">");
			html("<h2>Edit person</h2>");
			html_op("<div>");
				html_op("<div class=\"non_float\">");
					html("<label for=\"pname\">Person name</label>");
					html_op("<div class=\"stretch_input std_input\">");
						html("<div><input id=\"pname\" name=\"pname\" type=\"text\" value =\"".$pName."\"></div>");
					html_cl("</div>");
				html_cl("</div>");

				html("<div class=\"acc_controls\"><input class=\"btn ok_btn\" type=\"submit\" value=\"ok\"><a class=\"btn cancel_btn\" href=\"./person.php\">cancel</a></div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");
	html("</form>");
	html("</body>");
	html("</html>");
?>