<?php
	require_once("./setup.php");


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("./login.php");

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);
	$pers = new Person($user_id);

	$titleString = "Jezve Money";


	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");
	html(getCommonHeaders());

	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("iconlink.css"));
	html(getCSS("tiles.css"));
	html(getCSS("trlist.css"));
	html(getCSS("statistics.css"));
	html(getJS("common.js"));
	html(getJS("ready.js"));
	html(getJS("main.js"));
	html(getJS("raphael.js"));
	html(getJS("statistics.js"));

	html_op("<script>");

		$byCurrency = TRUE;
		$curr_acc_id = Currency::getIdByPos(0);
		if (!$curr_acc_id)
			fail();
		$trans_type = 1;		// expense
		$groupType_id = 2;		// group by week

		echo(Currency::getArray(TRUE));
		html("var accCurr = ".$curr_acc_id.";");
		html("var transType = ".json_encode($type_str).";");
		html("var groupType = ".json_encode($groupType).";");
		html("var chartData = ".json_encode(getStatArray($user_id, $byCurrency, $curr_acc_id, $trans_type, $groupType_id, 5)).";");
		html();
		if (isMessageSet())
			html("onReady(initMessage);");
		html("onReady(initStatWidget);");
	html_cl("</script>");
	html("</head>");
	html("<body>");

	html_op("<div class=\"page\">");
		html_op("<div class=\"page_wrapper\">");

	require_once("./templates/header.php");

		html_op("<div class=\"container centered\">");
	html_op("<div class=\"content\">");
		html_op("<div class=\"content_wrap\">");
			html_op("<div class=\"widget\">");
				html("<div class=\"widget_title\"><a href=\"./accounts.php\">Accounts &gt;</a></div>");
				html("<div class=\"tiles\">".$acc->getTiles()."</div>");
			html_cl("</div>");

			html();
			html_op("<div class=\"widget\">");
				html("<div class=\"widget_title\">Total &gt;</div>");
				html_op("<div class=\"info_tiles\">");
					$acc->getTotals();
				html_cl("</div>");
			html_cl("</div>");

			html();
			html_op("<div class=\"widget break_widget latest_widget\">");
				html("<div class=\"widget_title\"><a href=\"./transactions.php\">Latest &gt;</a></div>");
				$trans->getLatest(5);
			html_cl("</div>");

			html();
			html_op("<div class=\"widget\">");
				html("<div class=\"widget_title\"><a href=\"./persons.php\">Persons &gt;</a></div>");
				html_op("<div class=\"info_tiles\">");
					$pers->getTable();
				html_cl("</div>");
			html_cl("</div>");

			html();
			html_op("<div class=\"widget\">");
				html("<div class=\"widget_title\"><a href=\"./statistics.php\">Statistics &gt;</a></div>");
				html_op("<div class=\"charts widget_charts\">");
					html_op("<div class=\"right_float\">");
						html("<div id=\"vert_labels\"></div>");
					html_cl("</div>");
					html_op("<div class=\"chart_wrap\">");
						html_op("<div class=\"chart_content\">");
							html("<div id=\"chart\"></div>");
						html_cl("</div>");
					html_cl("</div>");
					html("<div id=\"chpopup\" class=\"chart_popup\" style=\"display: none;\"></div>");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");
	html("</body>");
	html("</html>");
?>