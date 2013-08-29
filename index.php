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

	$titleString = "Jezve Money";


	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");
	html(getCommonHeaders());

	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("tiles.css"));
	html(getCSS("table.css"));
	html(getJS("common.js"));
	html(getJS("main.js"));

	html("</head>");
	html("<body>");

	require_once("./templates/header.php");

	html("<div class=\"content\">", PUSH_AFTER);
		html("<div>", PUSH_AFTER);
			html("<div class=\"widget_title\"><a href=\"./accounts.php\">Accounts &gt;</a></div>");
			html("<div class=\"tiles\">".$acc->getTiles()."</div>");
		html("</div>", POP_BEFORE);

		html();
		html("<div>", PUSH_AFTER);
			html("<div class=\"widget_title\">Total &gt;</div>");
			html("<div>", PUSH_AFTER);
				echo($acc->getTotals());
			html("</div>", POP_BEFORE);
		html("</div>", POP_BEFORE);

		html();
		html("<div>", PUSH_AFTER);
			html("<div class=\"widget_title\"><a href=\"./transactions.php\">Latest &gt;</a></div>");
			html("<div>", PUSH_AFTER);
				$trans->getLatest(5);
			html("</div>", POP_BEFORE);
		html("</div>", POP_BEFORE);
	html("</div>", POP_BEFORE);
	html("</body>");
	html("</html>");
?>