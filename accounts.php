<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/person.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");
	require_once("./class/transaction.php");

	$user_id = User::check();
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
	html(getJS("common.js"));
	html(getJS("popup.js"));
	html(getJS("main.js"));

	html("</head>");
	html("<body>");

	require_once("./templates/header.php");

	html("<div class=\"content\">", PUSH_AFTER);
		html("<div>", PUSH_AFTER);
			html("<div class=\"heading\">", PUSH_AFTER);
				html("<h1>Accounts</h1>");
				html("<div id=\"add_btn\" class=\"iconlink\"><a href=\"./newaccount.php\"><div class=\"add\"></div><span>New</span></a></div>");
			html("</div>", POP_BEFORE);
			html("<div class=\"tiles\">".$acc->getTiles(TRUE)."</div>");
			html("<div class=\"control_icons\">", PUSH_AFTER);
				html("<div id=\"edit_btn\" class=\"iconlink\" style=\"display: none;\"><a href=\"#\"><div class=\"edit\"></div><span>Edit</span></a></div>");
				html("<div id=\"del_btn\" class=\"iconlink\" style=\"display: none;\"><button onclick=\"showDeletePopup();\"><div class=\"del\"></div><span>Delete</span></button></div>");
			html("</div>", POP_BEFORE);
		html("</div>", POP_BEFORE);
	html("</div>", POP_BEFORE);
	html("<form id=\"delform\" method=\"post\" action=\"./modules/delaccount.php\">");
	html("<input id=\"delaccounts\" name=\"accounts\" type=\"hidden\" value=\"\">");
	html("</form>");
	html("</body>");
	html("</html>");
?>
