﻿<?php
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
	$pers = new Person($user_id);

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
		html_cl("</div>");
	html_cl("</div>");
	html("</body>");
	html("</html>");
?>