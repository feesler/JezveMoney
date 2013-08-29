<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/person.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");
	require_once("./class/transaction.php");


	function fail()
	{
		echo("fail");
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


	//
	function showSubMenu()
	{
		global $trans_type;

		$acc_id = 0;
		if (isset($_GET["acc_id"]))
			$acc_id = intval($_GET["acc_id"]);

		$acc_par = (($acc_id != 0) ? "&amp;acc_id=".$acc_id : "");

		html("<div id=\"trtype_menu\" class=\"subHeader\">", PUSH_AFTER);

			$resStr = "<span>";
			$resStr .= (($trans_type == 1) ? "<b>" : "<a href=\"./newtransaction.php?type=expense".$acc_par."\">");
			$resStr .= "Expense";
			$resStr .= (($trans_type == 1) ? "</b>" : "</a>");
			$resStr .= "</span>";

			$resStr .= "<span>";
			$resStr .= (($trans_type == 2) ? "<b>" : "<a href=\"./newtransaction.php?type=income".$acc_par."\">");
			$resStr .= "Income";
			$resStr .= (($trans_type == 2) ? "</b>" : "</a>");
			$resStr .= "</span>";

			$resStr .= "<span>";
			$resStr .= (($trans_type == 3) ? "<b>" : "<a href=\"./newtransaction.php?type=transfer".$acc_par."\">");
			$resStr .= "Transfer";
			$resStr .= (($trans_type == 3) ? "</b>" : "</a>");
			$resStr .= "</span>";

			html($resStr);

		html("</div>", POP_BEFORE);
	}


	$user_id = User::check();
	if (!$user_id)
		setLocation("./login.php");

	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
		fail();

	$trans_id = intval($_GET["id"]);

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

	$tr = getTransProperties($trans_id);
	$trans_type = $tr["type"];			// TODO : temporarily

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
	html(getCSS("iconlink.css"));
	html(getCSS("calendar.css"));

	html(getJS("common.js"));
	html(getJS("main.js"));
	html(getJS("calendar.js"));
	html(getJS("transaction.js"));
	html(getJS("transaction_layout.js"));

	html("<script>");
	echo($acc->getArray());

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
	html("{", PUSH_AFTER);
		html("srcAcc : ".$tr["src_id"].",");
		html("destAcc : ".$tr["dest_id"].",");
		html("amount : ".$tr["amount"].",");
		html("charge : ".$tr["charge"].",");
		html("curr_id : ".$tr["curr"].",");
		html("type : ".$tr["type"]);
	html("};", POP_BEFORE);
	html("var edit_mode = true;");
	html("var trans_curr = ".$tr["curr"].";");
	html("var trans_acc_curr = ".$tr["curr"].";");
	html("var trans_type = ".$tr["type"].";");

	html("</script>");

	html("</head>");
	html("<body>");

	require_once("./templates/header.php");

	html("<form method=\"post\" action=\"./modules/edittransaction.php\" onsubmit=\"return onEditTransSubmit(this);\">");
	html("<input name=\"transid\" type=\"hidden\" value=\"".$tr["id"]."\">");
	html("<input name=\"transtype\" type=\"hidden\" value=\"".$tr["type"]."\">");

	html("<div class=\"tr_content\">", PUSH_AFTER);
		html("<div>", PUSH_AFTER);
			html("<h2>Edit transaction</h2>");
			html("<div>", PUSH_AFTER);
				showSubMenu();

	if ($trans_type == 1 || $trans_type == 3)
	{
		html("<div id=\"source\" class=\"acc_float\">", PUSH_AFTER);
			html("<div><label for=\"src_id\">Source account</label></div>");
			html("<div class=\"tile_container\">", PUSH_AFTER);
				html($acc->getDivTile($tr["src_id"], "source_tile"));
				html("<div class=\"acc_sel\">", PUSH_AFTER);
					html("<div>", PUSH_AFTER);
						html("<select id=\"src_id\" name=\"src_id\" onchange=\"".(($trans_type == 3) ? "onChangeSource" : "onChangeAcc")."();\">", PUSH_AFTER);
							echo($acc->getList($tr["src_id"]));
						html("</select>", POP_BEFORE);
					html("</div>", POP_BEFORE);
				html("</div>", POP_BEFORE);
			html("</div>", POP_BEFORE);

			html();
			html("<div class=\"tile_right_block\">", PUSH_AFTER);
				if ($trans_type == 1)
				{
					html("<div id=\"amount_left\" style=\"display: none;\">", PUSH_AFTER);
						html("<span>Amount</span>");
						html("<div>", PUSH_AFTER);
							html("<button id=\"amount_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onAmountSelect();\"><span>".Currency::format($tr["amount"], ($trans_type == 1) ? $src["curr"] : $dest["curr"])."</span></button>");
						html("</div>", POP_BEFORE);
					html("</div>", POP_BEFORE);
				}

				if ($trans_type == 1 || $trans_type == 3)
				{
					html("<div id=\"charge_left\" style=\"display: none;\">", PUSH_AFTER);
						html("<span>Charge</span>");
						html("<div>", PUSH_AFTER);
							html("<button id=\"charge_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onChargeSelect();\"><span>".Currency::format($tr["charge"], ($trans_type == 1) ? $src["curr"] : $dest["curr"])."</span></button>");
						html("</div>", POP_BEFORE);
					html("</div>", POP_BEFORE);
				}

				$disp = ((($trans_type == 3 && $src["curr"] == $dest["curr"]) || (($trans_type == 1 || $trans_type == 2) && $transAccCur == $tr["curr"])) ? " style=\"display: none;\"" : "");
				html("<div id=\"exch_left\"".$disp.">", PUSH_AFTER);
					html("<span>Exchange rate</span>");
					html("<div>", PUSH_AFTER);
						html("<button id=\"exchrate_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onExchRateSelect();\"><span>".round($tr["amount"] / $tr["charge"], 5)." ".$charge_sign."/".$amount_sign."</span></button>");
					html("</div>", POP_BEFORE);
				html("</div>", POP_BEFORE);

				html("<div id=\"src_res_balance_left\">", PUSH_AFTER);
					html("<span>Result balance</span>");
					html("<div>", PUSH_AFTER);
						html("<button id=\"resbal_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onResBalanceSelect();\"><span>".Currency::format($src["balance"], $src["curr"])."</span></button>");
					html("</div>", POP_BEFORE);
				html("</div>", POP_BEFORE);
			html("</div>", POP_BEFORE);
		html("</div>", POP_BEFORE);
	}

	if ($trans_type == 2 || $trans_type == 3)
	{
		html();
		html("<div id=\"destination\" class=\"acc_float\">", PUSH_AFTER);
				html("<div><label for=\"dest_id\">Destination account</label></div>");
				html("<div class=\"tile_container\">", PUSH_AFTER);
					html($acc->getDivTile($tr["dest_id"], "dest_tile"));
					html("<div class=\"acc_sel\">", PUSH_AFTER);
						html("<div>", PUSH_AFTER);
							html("<select id=\"dest_id\" name=\"dest_id\" onchange=\"".(($trans_type == 3) ? "onChangeDest" : "onChangeAcc")."();\">");
								echo($acc->getList($tr["dest_id"]));
							html("</select>", POP_BEFORE);
						html("</div>", POP_BEFORE);
					html("</div>", POP_BEFORE);
				html("</div>", POP_BEFORE);

				html();
				html("<div class=\"tile_right_block\">", PUSH_AFTER);
				if ($trans_type == 2)
				{
					html("<div id=\"amount_left\" style=\"display: none;\">", PUSH_AFTER);
						html("<span>Amount</span>");
						html("<div>", PUSH_AFTER);
							html("<button id=\"amount_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onAmountSelect();\"><span>".Currency::format($tr["amount"], ($trans_type == 1) ? $src["curr"] : $dest["curr"])."</span></button>");
						html("</div>", POP_BEFORE);
					html("</div>", POP_BEFORE);

					html("<div id=\"charge_left\" style=\"display: none;\">", PUSH_AFTER);
						html("<span>Charge</span>");
						html("<div>", PUSH_AFTER);
							html("<button id=\"charge_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onChargeSelect();\"><span>".Currency::format($tr["charge"], ($trans_type == 1) ? $src["curr"] : $dest["curr"])."</span></button>");
						html("</div>", POP_BEFORE);
					html("</div>", POP_BEFORE);

					html("<div id=\"exch_left\" style=\"display: none;\">", PUSH_AFTER);
						html("<span>Exchange rate</span>");
						html("<div>", PUSH_AFTER);
							html("<button id=\"exchrate_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onExchRateSelect();\"><span>".round($tr["amount"] / $tr["charge"], 5)." ".$charge_sign."/".$amount_sign."</span></button>");
						html("</div>", POP_BEFORE);
					html("</div>", POP_BEFORE);

					html("<div id=\"src_res_balance_left\">", PUSH_AFTER);
						html("<span>Result balance</span>");
						html("<div>", PUSH_AFTER);
							html("<button id=\"resbal_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onResBalanceSelect();\"><span>".Currency::format($dest["balance"], $dest["curr"])."</span></button>");
						html("</div>", POP_BEFORE);
					html("</div>", POP_BEFORE);
				}
				else if ($trans_type == 3)
				{
					html("<div id=\"amount_left\" style=\"display: none;\">", PUSH_AFTER);
						html("<span>Amount</span>");
						html("<div>", PUSH_AFTER);
							html("<button id=\"amount_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onAmountSelect();\"><span>".Currency::format($tr["amount"], ($trans_type == 1) ? $src["curr"] : $dest["curr"])."</span></button>");
						html("</div>", POP_BEFORE);
					html("</div>", POP_BEFORE);

					html("<div id=\"dest_res_balance_left\">", PUSH_AFTER);
						html("<span>Result balance</span>");
						html("<div>", PUSH_AFTER);
							html("<button id=\"resbal_d_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onResBalanceDestSelect();\"><span>".Currency::format($dest["balance"], $dest["curr"])."</span></button>");
						html("</div>", POP_BEFORE);
					html("</div>", POP_BEFORE);
				}
			html("</div>", POP_BEFORE);
		html("</div>", POP_BEFORE);
	}

	html();
	html("<div id=\"amount_row\" class=\"non_float\">", PUSH_AFTER);
		html("<div id=\"curr_block\" class=\"right_float\" style=\"display: none;\">", PUSH_AFTER);
			html("<div><label for=\"transcurr\">Currency</label></div>");
			html("<div class=\"stretch_input trans_input\">", PUSH_AFTER);
				html("<div class=\"currency_block\">", PUSH_AFTER);
					html("<select id=\"transcurr\" name=\"transcurr\" onchange=\"onChangeTransCurr(this);\">", PUSH_AFTER);
						echo(Currency::getList($tr["curr"]));
					html("</select>", POP_BEFORE);
				html("</div>", POP_BEFORE);
			html("</div>", POP_BEFORE);
		html("</div>", POP_BEFORE);

		html();
		html("<div>", PUSH_AFTER);
			echo($tabStr."<div><label for=\"amount\">Amount</label>");
			echo("<button id=\"ancurrbtn\" class=\"dashed_btn curr_btn\" type=\"button\" onclick=\"showCurrList();\"");
			if ($trans_type == 3)
				echo(" style=\"display: none;\"");
			echo("><span>Select currency</span></button></div>\r\n");
			html("<div>", PUSH_AFTER);
				html("<div class=\"right_float\"><span id=\"amountsign\" class=\"curr_sign\">".$amount_sign."</span></div>");
				html("<div class=\"stretch_input trans_input\">", PUSH_AFTER);
					html("<div>", PUSH_AFTER);
						html("<input id=\"amount\" name=\"amount\" class=\"summ_text\" type=\"text\" value=\"".$tr["amount"]."\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
					html("</div>", POP_BEFORE);
				html("</div>", POP_BEFORE);
			html("</div>", POP_BEFORE);
		html("</div>", POP_BEFORE);
	html("</div>", POP_BEFORE);


	$disp = ((($trans_type == 3 && $src["curr"] == $dest["curr"]) || (($trans_type == 1 || $trans_type == 2) && $transAccCur == $tr["curr"])) ? " style=\"display: none;\"" : "");
	html();
	html("<div id=\"chargeoff\" class=\"non_float\"".$disp.">", PUSH_AFTER);
		html("<div><label for=\"charge\">Charge</label></div>");
		html("<div>", PUSH_AFTER);
			html("<div class=\"right_float\"><span id=\"chargesign\" class=\"curr_sign\">".$charge_sign."</span></div>");
			html("<div class=\"stretch_input trans_input\">", PUSH_AFTER);
				html("<div>", PUSH_AFTER);
					html("<input id=\"charge\" name=\"charge\" class=\"summ_text\" type=\"text\" value=\"".$tr["charge"]."\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
				html("</div>", POP_BEFORE);
			html("</div>", POP_BEFORE);
		html("</div>", POP_BEFORE);
	html("</div>", POP_BEFORE);

	html();
	html("<div id=\"exchange\" class=\"non_float\" style=\"display: none;\">", PUSH_AFTER);
		html("<div><label for=\"exchrate\">Exchange rate</label></div>");
		html("<div>", PUSH_AFTER);
			html("<div class=\"right_float\"><span id=\"exchcomm\" class=\"exchrate_comm\">".$charge_sign."/".$amount_sign."</span></div>");
			html("<div class=\"stretch_input trans_input\">", PUSH_AFTER);
				html("<div>", PUSH_AFTER);
					html("<input id=\"exchrate\" class=\"summ_text\" type=\"text\" value=\"1\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\" value=\"".round($tr["amount"] / $tr["charge"], 5)."\">");
				html("</div>", POP_BEFORE);
			html("</div>", POP_BEFORE);
		html("</div>", POP_BEFORE);
	html("</div>", POP_BEFORE);

	html();
	html("<div id=\"result_balance\" class=\"non_float\" style=\"display: none;\">", PUSH_AFTER);
		html("<div><label for=\"resbal\">Result balance".(($trans_type == 3) ? " (Source)" : "")."</label></div>");
		html("<div>", PUSH_AFTER);
			html("<div class=\"right_float\"><span id=\"res_currsign\" class=\"curr_sign\">".$src["sign"]."</span></div>");
			html("<div class=\"stretch_input trans_input\">", PUSH_AFTER);
				html("<div>", PUSH_AFTER);
					html("<input id=\"resbal\" class=\"summ_text\" type=\"text\" value=\"\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
				html("</div>", POP_BEFORE);
			html("</div>", POP_BEFORE);
		html("</div>", POP_BEFORE);
	html("</div>", POP_BEFORE);

	if ($trans_type == 3)
	{
		html();
		html("<div id=\"result_balance_dest\" class=\"non_float\" style=\"display: none;\">", PUSH_AFTER);
			html("<div><label for=\"resbal_d\">Result balance (Destination)</label></div>");
			html("<div>", PUSH_AFTER);
				html("<div class=\"right_float\"><span id=\"res_currsign\" class=\"curr_sign\">".$dest["sign"]."</span></div>");
				html("<div class=\"stretch_input trans_input\">", PUSH_AFTER);
					html("<div>", PUSH_AFTER);
						html("<input id=\"resbal_d\" class=\"summ_text\" type=\"text\" value=\"\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
					html("</div>", POP_BEFORE);
				html("</div>", POP_BEFORE);
			html("</div>", POP_BEFORE);
		html("</div>", POP_BEFORE);
	}

	setTab(3);
	html();
	html("<div class=\"non_float\">", PUSH_AFTER);
		html("<div id=\"date_block\">", PUSH_AFTER);
			html("<div><label for=\"date\">Date</label></div>");
			html("<div>", PUSH_AFTER);
				html("<div class=\"right_float\"><div id=\"calendar_btn\" class=\"iconlink form_iconlink\"><button type=\"button\" onclick=\"showCalendar();\"><div class=\"calendar\"></div><span style=\"display: none;\">Change date</span></button></div></div>");
				html("<div class=\"stretch_input trans_input\">", PUSH_AFTER);
					html("<div>", PUSH_AFTER);
						html("<input id=\"date\" name=\"date\" type=\"text\" value=\"".(date("d.m.Y", strtotime($tr["date"])))."\">");
					html("</div>", POP_BEFORE);
				html("</div>", POP_BEFORE);
				html("<div id=\"calendar\" class=\"calWrap\" style=\"display: none;\"></div>");
				html("<script>buildCalendar();</script>");
			html("</div>", POP_BEFORE);
		html("</div>", POP_BEFORE);
	html("</div>", POP_BEFORE);

	html();
	html("<div class=\"non_float\">", PUSH_AFTER);
		html("<div id=\"comm_btn\" class=\"iconlink form_iconlink\"".(($tr["comment"] == "") ? "" : " style=\"display: none;\"")."><button type=\"button\" onclick=\"showComment();\"><div class=\"add\"></div><span>Add comment</span></button></div>");
		html("<div id=\"comment_block\"".(($tr["comment"] != "") ? "" : " style=\"display: none;\"").">", PUSH_AFTER);
			html("<div><label for=\"comm\">Comment</label></div>");
			html("<div>", PUSH_AFTER);
				html("<div class=\"stretch_input trans_input\">", PUSH_AFTER);
					html("<div>", PUSH_AFTER);
						html("<input id=\"comm\" name=\"comm\" type=\"text\" value=\"".$tr["comment"]."\">");
					html("</div>", POP_BEFORE);
				html("</div>", POP_BEFORE);
			html("</div>", POP_BEFORE);
		html("</div>", POP_BEFORE);
	html("</div>", POP_BEFORE);

	html();
	html("<div class=\"acc_controls\"><input id=\"submitbtn\" class=\"btn ok_btn\" type=\"submit\" value=\"ok\"><a class=\"btn cancel_btn\" href=\"./accounts.php\">cancel</a></div>");
	html("</div>", POP_BEFORE);
	html("</div>", POP_BEFORE);
	html("</div>", POP_BEFORE);
	html("</form>");
	html("</body>");
	html("</html>");
?>
