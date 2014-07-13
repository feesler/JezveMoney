<?php
	require_once("./setup.php");

	function fail()
	{
		setMessage(ERR_PERSON_UPDATE);
		setLocation("./persons.php");
	}


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("./login.php");

	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
		fail();

	$p_id = intval($_GET["id"]);

	$person = new Person($user_id);
	if (!$person->is_exist($p_id))
		fail();

	$pName = $person->getName($p_id);


	$titleString = "Jezve Money | Edit person";

	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");
	html(getCommonHeaders());

	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("iconlink.css"));
	html(getCSS("tiles.css"));
	html(getCSS("iconlink.css"));
	html(getCSS("popup.css"));
	html(getJS("common.js"));
	html(getJS("ready.js"));
	html(getJS("popup.js"));
	html(getJS("persons.js"));

	html("<script>");
	html("var person_id = ".$p_id.";");
	html("var personName = ".json_encode($pName).";");
	if (isMessageSet())
		html("onReady(initMessage);");
	html("</script>");

	html("</head>");
	html("<body>");

	html("<form method=\"post\" action=\"./modules/editperson.php\" onsubmit=\"return onEditPersonSubmit(this);\">");
	html("<input id=\"pid\" name=\"pid\" type=\"hidden\" value=\"".$p_id."\">");

	html_op("<div class=\"page\">");
		html_op("<div class=\"page_wrapper\">");

	require_once("./templates/header.tpl");

		html_op("<div class=\"container centered\">");
	html_op("<div class=\"content\">");
		html_op("<div class=\"content_wrap\">");
			html_op("<div class=\"heading h2_heading\">");
				html("<h2>Edit person</h2>");
				html(getIconLink(ICON_BUTTON, "del_btn", "del", "Delete", TRUE, "onDelete();"));
			html_cl("</div>");
			html_op("<div>");
				html_op("<div class=\"non_float std_margin\">");
					html("<label for=\"pname\">Person name</label>");
					html_op("<div class=\"stretch_input std_input\">");
						html("<div><input id=\"pname\" name=\"pname\" type=\"text\" value =\"".$pName."\"></div>");
					html_cl("</div>");
				html_cl("</div>");

				html("<div class=\"acc_controls\"><input class=\"btn ok_btn\" type=\"submit\" value=\"ok\"><a class=\"btn cancel_btn\" href=\"./person.php\">cancel</a></div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

	html("</form>");

	html("<form id=\"delform\" method=\"post\" action=\"./modules/delperson.php\">");
	html("<input name=\"persons\" type=\"hidden\" value=\"".$p_id."\">");
	html("</form>");

	html("</body>");
	html("</html>");
?>