<?php
	require_once("./setup.php");


	function fail()
	{
		setLocation("./index.php?edittrans=fail");
	}


	// Build array with properties of transaction
	function getTransProperties($trans_id)
	{
		global $db, $user_id;

		$resArr = array();

		$qRes = $db->selectQ("*", "transactions", "id=".$trans_id." AND user_id=".$user_id);

		if (count($qRes) != 1)
			return $resArr;

		$row = $qRes[0];
		$resArr["id"] = $trans_id;
		$resArr["src_id"] = intval($row["src_id"]);
		$resArr["dest_id"] = intval($row["dest_id"]);
		$resArr["type"] = intval($row["type"]);
		$resArr["curr"] = intval($row["curr_id"]);
		$resArr["amount"] = floatval($row["amount"]);
		$resArr["charge"] = floatval($row["charge"]);
		$resArr["date"] = $row["date"];
		$resArr["comment"] = $row["comment"];

		return $resArr;
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

	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
		fail();

	$trans_id = intval($_GET["id"]);

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

	$tr = getTransProperties($trans_id);
	$trans_type = $tr["type"];			// TODO : temporarily

	if ($trans_type == 4)
		setLocation("./editdebt.php?id=".$trans_id);

	$acc_count = $acc->getCount($trans_id);

	// get information about source and destination accounts
	$src = getAccountProperties($tr["src_id"]);
	$dest = getAccountProperties($tr["dest_id"]);

	$titleString = "Jezve Money | Edit transaction";

// Start render page
	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");
	html(getCommonHeaders());
	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("transaction.css"));
	html(getCSS("tiles.css"));
	html(getCSS("popup.css"));
	html(getCSS("iconlink.css"));
	html(getCSS("ddlist.css"));
	html(getCSS("calendar.css"));

	html(getJS("common.js"));
	html(getJS("ready.js"));
	html(getJS("calendar.js"));
	html(getJS("popup.js"));
	html(getJS("currency.js"));
	html(getJS("account.js"));
	html(getJS("ddlist.js"));
	html(getJS("transaction.js"));
	html(getJS("transaction_layout.js"));

	html("<script>");
	html("var accounts = ".f_json_encode($acc->getArray()).";");

	$transAcc_id = 0;	// main transaction account id
	$transAccCur = 0;	// currency of transaction account
	if ((($trans_type == 1 && $tr["dest_id"] == 0) || ($trans_type == 3 && $tr["dest_id"] != 0)) && $tr["src_id"] != 0)
		$transAcc_id = $tr["src_id"];
	else if ($trans_type == 2 && $tr["dest_id"] != 0 && $tr["src_id"] == 0)
		$transAcc_id = $tr["dest_id"];

	$src_curr = $acc->getCurrency($tr["src_id"]);
	$dest_curr = $acc->getCurrency($tr["dest_id"]);
	$transAccCur = $acc->getCurrency($transAcc_id);

	echo(Currency::getArray(TRUE));

	$amount_sign = Currency::getSign($tr["curr"]);
	$charge_sign = Currency::getSign($transAccCur);

	html();
	html("var transaction =");
	html_op("{");
		html("srcAcc : ".$tr["src_id"].",");
		html("destAcc : ".$tr["dest_id"].",");
		html("amount : ".$tr["amount"].",");
		html("charge : ".$tr["charge"].",");
		html("curr_id : ".$tr["curr"].",");
		html("type : ".$tr["type"]);
	html_cl("};");
	html("var edit_mode = true;");
	html("var trans_curr = ".$tr["curr"].";");
	html("var trans_acc_curr = ".$tr["curr"].";");
	html("var trans_type = ".$tr["type"].";");

	if (isMessageSet())
		html("onReady(initMessage);");
	html("onReady(initControls);");
	html("</script>");

	html("</head>");
	html("<body>");

	html("<form method=\"post\" action=\"./modules/edittransaction.php\" onsubmit=\"return onEditTransSubmit(this);\">");
	html("<input name=\"transid\" type=\"hidden\" value=\"".$tr["id"]."\">");
	html("<input name=\"transtype\" type=\"hidden\" value=\"".$tr["type"]."\">");

	html_op("<div class=\"page\">");
		html_op("<div class=\"page_wrapper\">");

	require_once("./templates/header.php");

		html_op("<div class=\"container centered\">");
	html_op("<div class=\"content\">");
		html_op("<div class=\"content_wrap\">");
			html_op("<div class=\"heading h2_heading\">");
				html("<h2>Edit transaction</h2>");
				html(getIconLink(ICON_BUTTON, "del_btn", "del", "Delete", TRUE, "onDelete();"));
			html_cl("</div>");
			html_op("<div>");
				$newTransMenu = array(array(1, "Expense", "./newtransaction.php?type=expense".$acc_par),
										array(2, "Income", "./newtransaction.php?type=income".$acc_par),
										array(3, "Transfer", "./newtransaction.php?type=transfer".$acc_par),
										array(4, "Debt", "./newdebt.php".$d_acc_par));
				showSubMenu($trans_type, $newTransMenu);

	if ($trans_type == 1 || $trans_type == 3)
	{
		html_op("<div id=\"source\" class=\"acc_float\">");
			html("<div><label for=\"src_id\">Source account</label></div>");
			html_op("<div class=\"tile_container\">");
				$balDiff = $tr["charge"];
				html($acc->getTileEx(STATIC_TILE, $tr["src_id"], $balDiff, "source_tile"));
				html("<input id=\"src_id\" name=\"src_id\" type=\"hidden\" value=\"".$tr["src_id"]."\">");
			html_cl("</div>");

			html();
			html_op("<div class=\"tile_right_block\">");
				if ($trans_type == 1)
				{
					getRightTileBlock("amount_left", FALSE, "Amount", "amount_b", "onAmountSelect();",
											Currency::format($tr["amount"], ($trans_type == 1) ? $src["curr"] : $dest["curr"]));
				}

				if ($trans_type == 1 || $trans_type == 3)
				{
					getRightTileBlock("charge_left", FALSE, "Charge", "charge_b", "onChargeSelect();",
											Currency::format($tr["charge"], ($trans_type == 1) ? $src["curr"] : $dest["curr"]));
				}

				$disp = (($trans_type == 3 && $src["curr"] == $dest["curr"]) ||
						(($trans_type == 1 || $trans_type == 2) && $transAccCur == $tr["curr"]));
				$disp = !$disp;
				getRightTileBlock("exch_left", $disp, "Exchange rate", "exchrate_b", "onExchRateSelect();",
											round($tr["amount"] / $tr["charge"], 5)." ".$charge_sign."/".$amount_sign);

				getRightTileBlock("src_res_balance_left", TRUE, "Result balance", "resbal_b", "onResBalanceSelect();",
											Currency::format($src["balance"], $src["curr"]));
			html_cl("</div>");
		html_cl("</div>");
	}

	if ($trans_type == 2 || $trans_type == 3)
	{
		html();
		html_op("<div id=\"destination\" class=\"acc_float\">");
			html("<div><label for=\"dest_id\">Destination account</label></div>");
			html_op("<div class=\"tile_container\">");
				if ($trans_type == 2)		// income or person give to us
					$balDiff = -$tr["charge"];
				else
					$balDiff = -$tr["amount"];
				html($acc->getTileEx(STATIC_TILE, $tr["dest_id"], $balDiff, "dest_tile"));
				html("<input id=\"dest_id\" name=\"dest_id\" type=\"hidden\" value=\"".$tr["dest_id"]."\">");
			html_cl("</div>");

			html();
			html_op("<div class=\"tile_right_block\">");

				getRightTileBlock("amount_left", FALSE, "Amount", "amount_b", "onAmountSelect();",
										Currency::format($tr["amount"], ($trans_type == 1) ? $src["curr"] : $dest["curr"]));
				if ($trans_type == 2)
				{
					getRightTileBlock("charge_left", FALSE, "Charge", "charge_b", "onChargeSelect();",
											Currency::format($tr["charge"], ($trans_type == 1) ? $src["curr"] : $dest["curr"]));
					getRightTileBlock("exch_left", FALSE, "Exchange rate", "exchrate_b", "onExchRateSelect();",
											round($tr["amount"] / $tr["charge"], 5)." ".$charge_sign."/".$amount_sign);
				}

				getRightTileBlock("dest_res_balance_left", TRUE, "Result balance", "resbal_d_b", "onResBalanceDestSelect();",
										Currency::format($dest["balance"], $dest["curr"]));
			html_cl("</div>");
		html_cl("</div>");
	}

	html();
	html_op("<div id=\"amount_row\" class=\"non_float\">");
		html("<div><label for=\"amount\">Amount</label></div>");
		html_op("<div>");
			html_op("<div class=\"curr_container\">");
				$currBtnClass = "btn rcurr_btn".(($trans_type == 3) ? " inact_rbtn" : "");
				html("<div class=\"".$currBtnClass."\"><div id=\"amountsign\">".$amount_sign."</div></div>");
				html("<input id=\"transcurr\" name=\"transcurr\" type=\"hidden\" value=\"".(($trans_type == 2) ? $dest["curr"] : $src["curr"])."\">");
			html_cl("</div>");

			$inputType = ($trans_type == 3) ? "trans_input" : "rbtn_input";
			html_op("<div class=\"stretch_input ".$inputType."\">");
				html_op("<div>");
					html("<input id=\"amount\" name=\"amount\" class=\"summ_text\" type=\"text\" value=\"".$tr["amount"]."\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");


	$disp = ((($trans_type == 3 && $src["curr"] == $dest["curr"]) || (($trans_type == 1 || $trans_type == 2) && $transAccCur == $tr["curr"])) ? " style=\"display: none;\"" : "");
	html();
	html_op("<div id=\"chargeoff\" class=\"non_float\"".$disp.">");
		html("<div><label for=\"charge\">Charge</label></div>");
		html_op("<div>");
			html("<div class=\"curr_container\"><div class=\"btn rcurr_btn inact_rbtn\"><div id=\"chargesign\">".$charge_sign."</div></div></div>");
			html_op("<div class=\"stretch_input trans_input\">");
				html_op("<div>");
					html("<input id=\"charge\" name=\"charge\" class=\"summ_text\" type=\"text\" value=\"".$tr["charge"]."\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

	html();
	html_op("<div id=\"exchange\" class=\"non_float\" style=\"display: none;\">");
		html("<div><label for=\"exchrate\">Exchange rate</label></div>");
		html_op("<div>");
			html("<div class=\"right_float\"><span id=\"exchcomm\" class=\"exchrate_comm\">".$charge_sign."/".$amount_sign."</span></div>");
			html_op("<div class=\"stretch_input trans_input\">");
				html_op("<div>");
					html("<input id=\"exchrate\" class=\"summ_text\" type=\"text\" value=\"1\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\" value=\"".round($tr["amount"] / $tr["charge"], 5)."\">");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

	if ($trans_type == 1 || $trans_type == 3)
	{
		html();
		html_op("<div id=\"result_balance\" class=\"non_float\" style=\"display: none;\">");
			html("<div><label for=\"resbal\">Result balance".(($trans_type == 3) ? " (Source)" : "")."</label></div>");
			html_op("<div>");
				html("<div class=\"curr_container\"><div class=\"btn rcurr_btn inact_rbtn\"><div id=\"res_currsign\">".$src["sign"]."</div></div></div>");
				html_op("<div class=\"stretch_input trans_input\">");
					html_op("<div>");
						html("<input id=\"resbal\" class=\"summ_text\" type=\"text\" value=\"\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
					html_cl("</div>");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");
	}

	if ($trans_type == 2 || $trans_type == 3)
	{
		html();
		html_op("<div id=\"result_balance_dest\" class=\"non_float\" style=\"display: none;\">");
			html("<div><label for=\"resbal_d\">Result balance".(($trans_type == 3) ? " (Destination)" : "")."</label></div>");
			html_op("<div>");
				html("<div class=\"curr_container\"><div class=\"btn rcurr_btn inact_rbtn\"><div id=\"res_currsign\">".$dest["sign"]."</div></div></div>");
				html_op("<div class=\"stretch_input trans_input\">");
					html_op("<div>");
						html("<input id=\"resbal_d\" class=\"summ_text\" type=\"text\" value=\"\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
					html_cl("</div>");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");
	}

	setTab(3);
	html();
	html_op("<div class=\"non_float\">");
		$dateFmt = date("d.m.Y", strtotime($tr["date"]));
		html(getIconLink(ICON_BUTTON, "calendar_btn", "calendar", "Change date", TRUE, "showCalendar();", "std_margin", $dateFmt));
		html_op("<div id=\"date_block\" style=\"display: none;\">");
			html("<div><label for=\"date\">Date</label></div>");
			html_op("<div>");
				html_op("<div class=\"right_float\">");
					html("<button id=\"cal_rbtn\" class=\"btn icon_btn cal_btn\" type=\"button\" onclick=\"showCalendar();\"><div></div></button>");
				html_cl("</div>");
				html_op("<div class=\"stretch_input rbtn_input\">");
					html_op("<div>");
						html("<input id=\"date\" name=\"date\" type=\"text\" value=\"".$dateFmt."\">");
					html_cl("</div>");
				html_cl("</div>");
				html("<div id=\"calendar\" class=\"calWrap\" style=\"display: none;\"></div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

	html();
	html_op("<div class=\"non_float\">");
		html(getIconLink(ICON_BUTTON, "comm_btn", "add", "Add comment", ($tr["comment"] == ""), "showComment();", "std_margin"));
		html_op("<div id=\"comment_block\"".(($tr["comment"] != "") ? "" : " style=\"display: none;\"").">");
			html("<div><label for=\"comm\">Comment</label></div>");
			html_op("<div>");
				html_op("<div class=\"stretch_input trans_input\">");
					html_op("<div>");
						html("<input id=\"comm\" name=\"comm\" type=\"text\" value=\"".$tr["comment"]."\">");
					html_cl("</div>");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

	html();
	html("<div class=\"acc_controls\"><input id=\"submitbtn\" class=\"btn ok_btn\" type=\"submit\" value=\"ok\"><a class=\"btn cancel_btn\" href=\"./accounts.php\">cancel</a></div>");
	html_cl("</div>");
	html_cl("</div>");
	html_cl("</div>");

			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

	html("</form>");

	html("<form id=\"delform\" method=\"post\" action=\"./modules/deltransaction.php\">");
	html("<input name=\"transactions\" type=\"hidden\" value=\"".$tr["id"]."\">");
	html("</form>");

	html("</body>");
	html("</html>");
?>
