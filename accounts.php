<?php
	require_once("./setup.php");


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("./login.php");

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

	$titleString = "Jezve Money | Accounts";

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
	html(getJS("currency.js"));
	html(getJS("toolbar.js"));
	html(getJS("main.js"));


	html_op("<script>");
		if (isMessageSet())
		{
			html("onReady(initMessage);");
		}
		html("onReady(initToolbar);");
	html_op("</script>");

	html("</head>");
	html("<body>");

	require_once("./templates/header.php");

	html_op("<div class=\"page_wrapper\">");
	html_op("<div class=\"content\">");
		html_op("<div class=\"content_wrap\">");
			html_op("<div class=\"heading\">");
				html("<h1>Accounts</h1>");
				html(getIconLink(ICON_LINK, "add_btn", "add", "New", TRUE, "./newaccount.php"));
			html_cl("</div>");
			html("<div class=\"tiles\">".$acc->getTiles(TRUE)."</div>");
/*
			html_op("<div class=\"control_icons\">");
				html(getIconLink(ICON_LINK, "edit_btn", "edit", "Edit", FALSE, "#"));
				html(getIconLink(ICON_LINK, "export_btn", "export", "Export to CSV", FALSE, "#"));
				html(getIconLink(ICON_BUTTON, "del_btn", "del", "Delete", FALSE, "showDeletePopup();"));
			html_cl("</div>");
*/
		html_cl("</div>");

		html_op("<div id=\"toolbar\" class=\"sidebar\" style=\"display: none;\">");
			html_op("<div>");
				html_op("<div id=\"tb_content\" class=\"siderbar_content\">");
					html("<div id=\"sbEllipsis\" class=\"sidebar_ellipsis\"></div>");
					html(getIconLink(ICON_LINK, "edit_btn", "icon_white edit", "Edit", FALSE, "#"));
					html(getIconLink(ICON_LINK, "export_btn", "icon_white export", "Export to CSV", FALSE, "#"));
					html(getIconLink(ICON_BUTTON, "del_btn", "icon_white del", "Delete", FALSE, "showDeletePopup();"));
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");

	html_cl("</div>");
	html_cl("</div>");
	html("<form id=\"delform\" method=\"post\" action=\"./modules/delaccount.php\">");
	html("<input id=\"delaccounts\" name=\"accounts\" type=\"hidden\" value=\"\">");
	html("</form>");
	html("</body>");
	html("</html>");
?>