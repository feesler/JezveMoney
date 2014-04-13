<?php
	require_once("./setup.php");


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("./login.php");

	$pers = new Person($user_id);

	$titleString = "Jezve Money | Persons";

	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");

	html(getCommonHeaders());

	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("tiles.css"));
	html(getCSS("iconlink.css"));
	html(getCSS("popup.css"));
	html(getCSS("toolbar.css"));
	html("<link rel=\"stylesheet\" media=\"all and (min-width: 701px)\" type=\"text/css\" href=\"./css/screen.css\" />");
	html(getJS("common.js"));
	html(getJS("ready.js"));
	html(getJS("popup.js"));
	html(getJS("toolbar.js"));
	html(getJS("persons.js"));

	if (isMessageSet())
	{
		html_op("<script>");
			html("onReady(initMessage);");
		html_op("</script>");
	}

	html("</head>");
	html("<body>");

	html_op("<div class=\"page\">");
		html_op("<div class=\"page_wrapper\">");

	require_once("./templates/header.php");

		html_op("<div class=\"container centered\">");
	html_op("<div class=\"content\">");
		html_op("<div class=\"content_wrap\">");
			html_op("<div class=\"heading\">");
				html("<h1>Persons</h1>");
				html(getIconLink(ICON_LINK, "add_btn", "add", "New", TRUE, "./newperson.php"));
			html_cl("</div>");
			html("<div class=\"tiles\">".$pers->getTiles(TRUE)."</div>");
		html_cl("</div>");
	html_cl("</div>");

			html_cl("</div>");
		html_cl("</div>");

		html_op("<div id=\"toolbar\" class=\"sidebar\" style=\"display: none;\">");
			html_op("<div>");
				html_op("<div id=\"tb_content\" class=\"siderbar_content\">");
					html("<div id=\"sbEllipsis\" class=\"sidebar_ellipsis\"></div>");

					html(getIconLink(ICON_LINK, "edit_btn", "icon_white edit", "Edit", FALSE, "#"));
					html(getIconLink(ICON_BUTTON, "del_btn", "icon_white del", "Delete", FALSE, "showDeletePopup();"));
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");

	html_cl("</div>");

	html("<form id=\"delform\" method=\"post\" action=\"./modules/delperson.php\">");
	html("<input id=\"delpersons\" name=\"persons\" type=\"hidden\" value=\"\">");
	html("</form>");
	html("</body>");
	html("</html>");
?>