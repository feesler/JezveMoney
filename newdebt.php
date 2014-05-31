﻿<?php
	require_once("./setup.php");


	function fail()
	{
		setLocation("./index.php?newdebt=fail");
	}


	// Build array with some account properties
	function getAccountProperties($acc_id)
	{
		global $acc;

		if (!$acc_id || !is_numeric($acc_id))
			return NULL;

		$acc_id = intval($acc_id);

		$resArr = array();
		$resArr["id"] = $acc_id;
		$resArr["balance"] = $acc->getBalance($acc_id);
		$resArr["curr"] = $acc->getCurrency($acc_id);
		$resArr["sign"] = Currency::getSign($resArr["curr"]);

		return $resArr;
	}


	// Try to find account different from specified
	function getAnotherAccount($acc_id)
	{
		global $acc;

		if ($acc_id != 0 && $acc->getCount() < 2)
			return 0;

		$newacc_id = $acc->getIdByPos(0);
		if ($newacc_id == $acc_id)
			$newacc_id = $acc->getIdByPos(1);

		return $newacc_id;
	}


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("./login.php");

	$trans_type = 4;
	$give = TRUE;

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);
	$debt = new Debt($user_id);
	$person = new Person($user_id);

	// check predefined account
	$acc_id = 0;
	if (isset($_GET["acc_id"]))
		$acc_id = intval($_GET["acc_id"]);
	if (!$acc_id || !$acc->is_exist($acc_id))		// TODO : think about redirect or warning message
		$acc_id = $acc->getIdByPos(0);
	if (!$acc_id)
		fail();
	$debtAcc = getAccountProperties($acc_id);
	$acc_count = $acc->getCount();


	$fperson_id = $person->getIdByPos(0);
	$fperson_name = $person->getName($fperson_id);

	$fperson_acc = $person->getAccount($fperson_id, $debtAcc["curr"]);
	$acc = new Account($user_id, TRUE);		// TODO : think how to improve this
	$fperson_balance = $fperson_acc ? $acc->getBalance($fperson_acc, TRUE) : 0.0;
	$acc = new Account($user_id);

	if ($give)
		$accLbl = "Destination account";
	else
		$accLbl = "Source account";

	$titleString = "Jezve Money | New debt";

// Start render page
	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");
	html(getCommonHeaders());
	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("transaction.css"));
	html(getCSS("tiles.css"));
	html(getCSS("iconlink.css"));
	html(getCSS("ddlist.css"));
	html(getCSS("calendar.css"));

	html(getJS("common.js"));
	html(getJS("ready.js"));
	html(getJS("currency.js"));
	html(getJS("account.js"));
	html(getJS("main.js"));
	html(getJS("calendar.js"));
	html(getJS("ddlist.js"));
	html(getJS("transaction.js"));
	html(getJS("transaction_layout.js"));

	html("<script>");
	html("var accounts = ".f_json_encode($acc->getArray()).";");
	echo(Currency::getArray(TRUE));
	html("var trans_curr = ".$debtAcc["curr"].";");
	html("var trans_acc_curr = ".$debtAcc["curr"].";");

	$person->getArray();

	html("var trans_type = ".$trans_type.";");
	html("var debtType = ".($give ? "true" : "false").";	// true - give, false - take");
	html("var edit_mode = false;");

	if (isMessageSet())
		html("onReady(initMessage);");
	html("onReady(initControls);");
	html("</script>");

	html("</head>");
	html("<body>");

	html("<form method=\"post\" action=\"./modules/debt.php\" onsubmit=\"return onDebtSubmit(this);\">");

	html_op("<div class=\"page\">");
		html_op("<div class=\"page_wrapper\">");

	require_once("./templates/header.php");

		html_op("<div class=\"container centered\">");
	html_op("<div class=\"content\">");
		html_op("<div class=\"content_wrap\">");
			html("<h2>Create new debt</h2>");
			html_op("<div>");
				$acc_par = (($acc_id != 0) ? "&amp;acc_id=".$acc_id : "");
				$d_acc_par = (($acc_id != 0) ? "?acc_id=".$acc_id : "");
				$newTransMenu = array(array(1, "Expense", "./newtransaction.php?type=expense".$acc_par),
										array(2, "Income", "./newtransaction.php?type=income".$acc_par),
										array(3, "Transfer", "./newtransaction.php?type=transfer".$acc_par),
										array(4, "Debt", "./newdebt.php".$d_acc_par));
				showSubMenu($trans_type, $newTransMenu);

				if (isset($_GET["act"]) && isset($_GET["detail"]))
				{
					html_op("<div style=\"padding-left: 50px;\">");
					if ($_GET["act"] == "fail" && $_GET["detail"] == "person")
						html("<span style=\"color: #FF2020;\">Person already exist.</span>");
					html_cl("</div>");
				}

		if (!$acc_count)
		{
			html("<div class=\"align_block\"><span>You have no one account. Please create one.</span></div>");
		}
		else
		{
			html_op("<div id=\"person\" class=\"acc_float\">");
				html("<input id=\"person_id\" name=\"person_id\" type=\"hidden\" value=\"".$fperson_id."\">");
				html("<div><label for=\"personsel\">Person name</label></div>");
				html_op("<div>");
					if (!$person->getCount())
					{
						html_op("<div class=\"tile_container\">");
							html(getTile(STATIC_TILE, "person_tile", "New person",
													Currency::format(0, $debtAcc["curr"]),
													NULL, "inact"));
						html_cl("</div>");
					}
					else
					{
						html_op("<div class=\"tile_container\">");
							html(getTile(STATIC_TILE, "person_tile", $fperson_name,
												Currency::format($fperson_balance, $debtAcc["curr"]),
												NULL));
						html_cl("</div>");
					}

					html();
					html_op("<div class=\"tile_right_block\">");		// tile_right_block person_trb
						getRightTileBlock("amount_left", FALSE, "Amount", "amount_b",
													"onAmountSelect();",
													Currency::format(0, $debtAcc["curr"]));

						getRightTileBlock("exch_left", FALSE, "Exchange rate", "exchrate_b",
													"onExchRateSelect();",
													"1 ".$debtAcc["sign"]."/".$debtAcc["sign"]);

						getRightTileBlock("src_res_balance_left", TRUE, "Result balance", "resbal_b",
													"onResBalanceSelect();",
													Currency::format($fperson_balance, $debtAcc["curr"]));
					html_cl("</div>");
				html_cl("</div>");
			html_cl("</div>");
			html();


		html_op("<div id=\"source\" class=\"acc_float\">");
			html("<div><label id=\"acclbl\" for=\"acc_id\">".$accLbl."</label></div>");
			html_op("<div class=\"tile_container\">");
				html($acc->getTile(STATIC_TILE, $acc_id, "acc_tile"));
				html("<input id=\"acc_id\" name=\"acc_id\" type=\"hidden\" value=\"".$acc_id."\">");
			html_cl("</div>");

			html();
			html_op("<div class=\"tile_right_block\">");
				getRightTileBlock("charge_left", FALSE, "Charge", "charge_b", "onChargeSelect();",
										Currency::format(0, $debtAcc["curr"]));

				getRightTileBlock("dest_res_balance_left", TRUE, "Result balance", "resbal_d_b",
										"onResBalanceDestSelect();",
										Currency::format($debtAcc["balance"], $debtAcc["curr"]));
			html_cl("</div>");
		html_cl("</div>");

	html_op("<div id=\"operation\" class=\"non_float\">");
		html("<div><label for=\"debtop\">Operation</label></div>");
		html_op("<div class=\"op_sel\">");
			html("<input id=\"debtgive\" name=\"debtop\" type=\"radio\" value=\"1\" onchange=\"onChangeDebtOp();\" checked><span>give</span>");
			html("<input id=\"debttake\" name=\"debtop\" type=\"radio\" value=\"2\" onchange=\"onChangeDebtOp();\"><span>take</span>");
		html_cl("</div>");
	html_cl("</div>");
	html();

	html();
	html_op("<div id=\"amount_row\" class=\"non_float\">");
		html("<div><label for=\"amount\">Amount</label></div>");
		html_op("<div>");
			html_op("<div class=\"curr_container\">");
				html("<div class=\"btn rcurr_btn\"><div id=\"amountsign\">".$debtAcc["sign"]."</div></div>");
				html("<input id=\"transcurr\" name=\"transcurr\" type=\"hidden\" value=\"".$debtAcc["curr"]."\">");
			html_cl("</div>");

			html_op("<div class=\"stretch_input rbtn_input\">");
				html_op("<div>");
					html("<input id=\"amount\" name=\"amount\" class=\"summ_text\" type=\"text\" value=\"\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

	html();
	html_op("<div id=\"chargeoff\" class=\"non_float\" style=\"display: none;\">");
		html("<div><label for=\"charge\">Charge</label></div>");
		html_op("<div>");
			html("<div class=\"curr_container\"><div class=\"btn rcurr_btn inact_rbtn\"><div id=\"chargesign\">".$debtAcc["sign"]."</div></div></div>");
			html_op("<div class=\"stretch_input trans_input\">");
				html_op("<div>");
					html("<input id=\"charge\" name=\"charge\" class=\"summ_text\" type=\"text\" value=\"\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

	html();
	html_op("<div id=\"exchange\" class=\"non_float\" style=\"display: none;\">");
		html("<div><label for=\"exchrate\">Exchange rate</label></div>");
		html_op("<div>");
			html("<div class=\"right_float\"><span id=\"exchcomm\" class=\"exchrate_comm\">".$debtAcc["sign"]."/".$debtAcc["sign"]."</span></div>");
			html_op("<div class=\"stretch_input trans_input\">");
				html_op("<div>");
					html("<input id=\"exchrate\" class=\"summ_text\" type=\"text\" value=\"1\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

	html();
	html_op("<div id=\"result_balance\" class=\"non_float\" style=\"display: none;\">");
		html("<div><label for=\"resbal\">Result balance (Person)</label></div>");
		html_op("<div>");
			html("<div class=\"curr_container\"><div class=\"btn rcurr_btn inact_rbtn\"><div id=\"res_currsign\">".$debtAcc["sign"]."</div></div></div>");
			html_op("<div class=\"stretch_input trans_input\">");
				html_op("<div>");
					html("<input id=\"resbal\" class=\"summ_text\" type=\"text\" value=\"\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

	html();
	html_op("<div id=\"result_balance_dest\" class=\"non_float\" style=\"display: none;\">");
		html("<div><label for=\"resbal_d\">Result balance (Account)</label></div>");
		html_op("<div>");
			html("<div class=\"curr_container\"><div class=\"btn rcurr_btn inact_rbtn\"><div id=\"res_currsign_d\">".$debtAcc["sign"]."</div></div></div>");
			html_op("<div class=\"stretch_input trans_input\">");
				html_op("<div>");
					html("<input id=\"resbal_d\" class=\"summ_text\" type=\"text\" value=\"\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

	html();
	html_op("<div class=\"non_float\">");
		$today = date("d.m.Y");
		html(getIconLink(ICON_BUTTON, "calendar_btn", "calendar", "Change date", TRUE, "showCalendar();", "std_margin", $today));
		html_op("<div id=\"date_block\" style=\"display: none;\">");
			html("<div><label for=\"date\">Date</label></div>");
			html_op("<div>");
				html_op("<div class=\"right_float\">");
					html("<button id=\"cal_rbtn\" class=\"btn icon_btn cal_btn\" type=\"button\" onclick=\"showCalendar();\"><div></div></button>");
				html_cl("</div>");
				html_op("<div class=\"stretch_input rbtn_input\">");
					html_op("<div>");
						html("<input id=\"date\" name=\"date\" type=\"text\" value=\"".$today."\">");
					html_cl("</div>");
				html_cl("</div>");
				html("<div id=\"calendar\" class=\"calWrap\" style=\"display: none;\"></div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

	html();
	html_op("<div class=\"non_float\">");
		html(getIconLink(ICON_BUTTON, "comm_btn", "add", "Add comment", TRUE, "showComment();", "std_margin"));
		html_op("<div id=\"comment_block\" style=\"display: none;\">");
			html("<div><label for=\"comm\">Comment</label></div>");
			html_op("<div>");
				html_op("<div class=\"stretch_input trans_input\">");
					html_op("<div>");
						html("<input id=\"comm\" name=\"comm\" type=\"text\" value=\"\">");
					html_cl("</div>");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

	html();
	html("<div class=\"acc_controls\"><input id=\"submitbtn\" class=\"btn ok_btn\" type=\"submit\" value=\"ok\"><a class=\"btn cancel_btn\" href=\"./accounts.php\">cancel</a></div>");

	}

	html_cl("</div>");
	html_cl("</div>");
	html_cl("</div>");

			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

	html("</form>");
	html("</body>");
	html("</html>");
?>