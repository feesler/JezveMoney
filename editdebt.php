<?php
	require_once("./setup.php");


	function fail()
	{
		setMessage(ERR_DEBT_UPDATE);
		setLocation("./index.php");
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
		$resArr["owner"] = $acc->getOwner($acc_id);
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

	$trans_type = 4;

	$trans_id = intval($_GET["id"]);

	$acc = new Account($user_id, TRUE);
	$trans = new Transaction($user_id);
	$debt = new Debt($user_id);
	$person = new Person($user_id);

	if (!$trans->is_exist($trans_id))
		fail();

	$tr = getTransProperties($trans_id);
	$trans_type = $tr["type"];			// TODO : temporarily

	// get information about source and destination accounts
	$src = getAccountProperties($tr["src_id"]);
	$dest = getAccountProperties($tr["dest_id"]);

	$user_owner = $u->getOwner($user_id);
	$give = (!is_null($src) && $src["owner"] != $user_owner);

	$person_id = ($give) ? $src["owner"] : $dest["owner"];
	$person_name = $person->getName($person_id);

	$person_acc_id = ($give) ? $tr["src_id"] : $tr["dest_id"];
	$acc = new Account($user_id, TRUE);		// TODO : think how to improve this
	$person_acc = getAccountProperties($person_acc_id);
	$person_res_balance = $person_acc["balance"];
	$person_balance = $person_res_balance + (($give) ? $tr["amount"] : -$tr["amount"]);

	$acc = new Account($user_id);
	$acc_count = $acc->getCount($trans_id);

	$debtAcc = $give ? $dest : $src;
	$noAccount = is_null($debtAcc);

	$amountCurr = $tr["curr"];
	if ($noAccount)
	{
		$chargeCurr = $person_acc["curr"];
		$acc_id = $acc->getIdByPos(0);
		$acc_balance = Currency::format($acc->getBalance($acc_id), $acc->getCurrency($acc_id));
	}
	else
	{
		$acc_id = 0;
		$chargeCurr = $debtAcc["curr"];
	}

	if ($noAccount)
	{
		$accLbl = "No account";
	}
	else
	{
		if ($give)
			$accLbl = "Destination account";
		else
			$accLbl = "Source account";
	}

	$titleString = "Jezve Money | Edit debt";

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
	html(getCSS("popup.css"));

	html(getJS("common.js"));
	html(getJS("ready.js"));
	html(getJS("calendar.js"));
	html(getJS("ddlist.js"));
	html(getJS("popup.js"));
	html(getJS("currency.js"));
	html(getJS("account.js"));
	html(getJS("transaction.js"));
	html(getJS("transaction_layout.js"));

	html("<script>");
	html("var accounts = ".f_json_encode($acc->getArray()).";");
	echo(Currency::getArray(TRUE));

	$amount_sign = Currency::getSign($tr["curr"]);
	$charge_sign = Currency::getSign($debtAcc["curr"]);

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

	$person->getArray();

	html("var trans_type = ".$tr["type"].";");
	html("var debtType = ".($give ? "true" : "false").";	// true - give, false - take");
	html("var lastAcc_id = ".$acc_id.";");
	html("var noAccount = ".($noAccount ? "true" : "false").";");

	if (isMessageSet())
		html("onReady(initMessage);");
	html("onReady(initControls);");
	html("</script>");

	html("</head>");
	html("<body>");

	html("<form method=\"post\" action=\"./modules/editdebt.php\" onsubmit=\"return onDebtSubmit(this);\">");
	html("<input name=\"transid\" type=\"hidden\" value=\"".$tr["id"]."\">");
	html("<input name=\"transtype\" type=\"hidden\" value=\"".$tr["type"]."\">");

	html_op("<div class=\"page\">");
		html_op("<div class=\"page_wrapper\">");

	require_once("./templates/header.tpl");

		html_op("<div class=\"container centered\">");
	html_op("<div class=\"content\">");
		html_op("<div class=\"content_wrap\">");
			html_op("<div class=\"heading h2_heading\">");
				html("<h2>Edit debt</h2>");
				html(getIconLink(ICON_BUTTON, "del_btn", "del", "Delete", TRUE, "onDelete();"));
			html_cl("</div>");
			html_op("<div>");
				$newTransMenu = array(array(1, "Expense", "./newtransaction.php?type=expense".$acc_par),
										array(2, "Income", "./newtransaction.php?type=income".$acc_par),
										array(3, "Transfer", "./newtransaction.php?type=transfer".$acc_par),
										array(4, "Debt", "./newdebt.php".$d_acc_par));
				showSubMenu($trans_type, $newTransMenu);

			html_op("<div id=\"person\" class=\"acc_float\">");
				html("<input id=\"person_id\" name=\"person_id\" type=\"hidden\" value=\"".$person_id."\">");
				html("<div><label>Person name</label></div>");
				html_op("<div>");
					html_op("<div class=\"tile_container\">");
						html(getTile(STATIC_TILE, "person_tile", $person_name,
											Currency::format($person_balance, $amountCurr),
											NULL));
					html_cl("</div>");

					html();
					html_op("<div class=\"tile_right_block\">");		// tile_right_block person_trb
						getRightTileBlock("amount_left", FALSE, "Amount", "amount_b",
													"onAmountSelect();",
													Currency::format($tr["amount"], $amountCurr));

						getRightTileBlock("exch_left", ($amountCurr != $chargeCurr), "Exchange rate", "exchrate_b", "onExchRateSelect();",
													round($tr["amount"] / $tr["charge"], 5)." ".$charge_sign."/".$amount_sign);

						getRightTileBlock("src_res_balance_left", TRUE, "Result balance", "resbal_b",
													"onResBalanceSelect();",
													Currency::format($person_res_balance, $amountCurr));

						if ($noAccount)
						{
							getRightTileBlock("charge_left", FALSE, "Charge", "charge_b", "onChargeSelect();",
													Currency::format(0, $chargeCurr));
						}
					html_cl("</div>");
				html_cl("</div>");
			html_cl("</div>");
			html();


		html_op("<div id=\"source\" class=\"acc_float\">");
			$closeIcon = getIconLink(ICON_BUTTON, "noacc_btn", "close_gray", NULL, !$noAccount, "toggleEnableAccount();", "small_icon");
			html("<div class=\"tile_header\"><label id=\"acclbl\">".$accLbl."</label>".$closeIcon."</div>");
			$disp = $noAccount ? " style=\"display: none;\"" : "";
			html_op("<div class=\"tile_container\"".$disp.">");
				if ($noAccount)
				{
					html($acc->getTileEx(STATIC_TILE, $acc_id, $acc_balance, "acc_tile"));
					html("<input id=\"acc_id\" name=\"acc_id\" type=\"hidden\" value=\"".$acc_id."\">");
				}
				else
				{
					html($acc->getTileEx(STATIC_TILE, $debtAcc["id"], $tr["charge"], "acc_tile"));
					html("<input id=\"acc_id\" name=\"acc_id\" type=\"hidden\" value=\"".$debtAcc["id"]."\">");
				}
			html_cl("</div>");

			html();
			html_op("<div class=\"tile_right_block\"".$disp.">");
				if (!$noAccount)
				{
					getRightTileBlock("charge_left", FALSE, "Charge", "charge_b", "onChargeSelect();",
											Currency::format(0, $chargeCurr));
				}

				getRightTileBlock("dest_res_balance_left", TRUE, "Result balance", "resbal_d_b",
										"onResBalanceDestSelect();",
										Currency::format($debtAcc["balance"], $debtAcc["curr"]));
			html_cl("</div>");

			$disp = $noAccount ? "" : " style=\"display: none;\"";
			html_op("<div id=\"selaccount\" class=\"selacc_container\"".$disp.">");
				html("<button class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"toggleEnableAccount();\"><span>Select account</span></button>");
			html_cl("</div>");
		html_cl("</div>");

	html_op("<div id=\"operation\" class=\"non_float\">");
		html("<div><label>Operation</label></div>");
		html_op("<div class=\"op_sel\">");
			html("<input id=\"debtgive\" name=\"debtop\" type=\"radio\" value=\"1\" onchange=\"onChangeDebtOp();\"".($give ? " checked" : "")."><span>give</span>");
			html("<input id=\"debttake\" name=\"debtop\" type=\"radio\" value=\"2\" onchange=\"onChangeDebtOp();\"".($give ? "" : " checked")."><span>take</span>");
		html_cl("</div>");
	html_cl("</div>");
	html();

	html();
	html_op("<div id=\"amount_row\" class=\"non_float\">");
		html("<div><label for=\"amount\">Amount</label></div>");
		html_op("<div>");
			html_op("<div class=\"curr_container\">");
				html("<div class=\"btn rcurr_btn\"><div id=\"amountsign\">".$amount_sign."</div></div>");
				html("<input id=\"transcurr\" name=\"transcurr\" type=\"hidden\" value=\"".$amountCurr."\">");
			html_cl("</div>");

			html_op("<div class=\"stretch_input rbtn_input\">");
				html_op("<div>");
					html("<input id=\"amount\" name=\"amount\" class=\"summ_text\" type=\"text\" value=\"".$tr["amount"]."\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");


	html();
	$disp = (($amountCurr == $chargeCurr) ? " style=\"display: none;\"" : "");
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
			html("<div class=\"right_float\"><span id=\"exchcomm\" class=\"exchrate_comm\">".$debtAcc["sign"]."/".$debtAcc["sign"]."</span></div>");
			html_op("<div class=\"stretch_input trans_input\">");
				html_op("<div>");
					html("<input id=\"exchrate\" class=\"summ_text\" type=\"text\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\" value=\"".round($tr["amount"] / $tr["charge"], 5)."\">");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

	html();
	html_op("<div id=\"result_balance\" class=\"non_float\" style=\"display: none;\">");
		html("<div><label for=\"resbal\">Result balance (Person)</label></div>");
		html_op("<div>");
			html("<div class=\"curr_container\"><div class=\"btn rcurr_btn inact_rbtn\"><div id=\"res_currsign\">".$amount_sign."</div></div></div>");
			html_op("<div class=\"stretch_input trans_input\">");
				html_op("<div>");
					html("<input id=\"resbal\" class=\"summ_text\" type=\"text\" value=\"".$person_res_balance."\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
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

	setTab(3);
	html();
	html_op("<div class=\"non_float\">");
		$dateFmt = date("d.m.Y", strtotime($tr["date"]));
		html(getIconLink(ICON_BUTTON, "calendar_btn", "calendar", "Change date", TRUE, "showCalendar();", "std_margin", $dateFmt));
		html_op("<div id=\"date_block\" style=\"display: none;\">");
			html("<div><label for=\"date\">Date</label></div>");
			html_op("<div>");
				html_op("<div class=\"right_float\">");
					html("<button id=\"cal_rbtn\" class=\"btn icon_btn cal_btn\" type=\"button\" onclick=\"showCalendar();\"><span></span></button>");
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
