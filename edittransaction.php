﻿<?php
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

		html_op("<div id=\"trtype_menu\" class=\"subHeader\">");

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

		html_cl("</div>");
	}


	// Return markup for right tile block
	function getRightTileBlock($div_id, $isVisible, $label_str, $btn_id, $btn_event, $btn_str)
	{
		$d_id = (($div_id && $div_id != "") ? " id=\"".$div_id."\"" : "");
		$disp = ($isVisible ? "" : " style=\"display: none;\"");
		$b_id = (($btn_id && $btn_id != "") ? " id=\"".$btn_id."\"" : "");
		$b_ev = (($btn_event && $btn_event != "") ? " onclick=\"".$btn_event."\"" : "");

		html_op("<div".$d_id.$disp.">");
			if ($label_str && $label_str != "")
				html("<span>".$label_str."</span>");
			html_op("<div>");
				html("<button".$b_id." class=\"dashed_btn resbal_btn\" type=\"button\"".$b_ev."><span>".$btn_str."</span></button>");
			html_cl("</div>");
		html_cl("</div>");
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

	html("</script>");

	html("</head>");
	html("<body>");

	require_once("./templates/header.php");

	html("<form method=\"post\" action=\"./modules/edittransaction.php\" onsubmit=\"return onEditTransSubmit(this);\">");
	html("<input name=\"transid\" type=\"hidden\" value=\"".$tr["id"]."\">");
	html("<input name=\"transtype\" type=\"hidden\" value=\"".$tr["type"]."\">");

	html_op("<div class=\"tr_content\">");
		html_op("<div>");
			html("<h2>Edit transaction</h2>");
			html_op("<div>");
				showSubMenu();

	if ($trans_type == 1 || $trans_type == 3)
	{
		html_op("<div id=\"source\" class=\"acc_float\">");
			html("<div><label for=\"src_id\">Source account</label></div>");
			html_op("<div class=\"tile_container\">");
				html($acc->getDivTile($tr["src_id"], "source_tile"));
				html_op("<div class=\"acc_sel\">");
					html_op("<div>");
						html_op("<select id=\"src_id\" name=\"src_id\" onchange=\"".(($trans_type == 3) ? "onChangeSource" : "onChangeAcc")."();\">");
							echo($acc->getList($tr["src_id"]));
						html_cl("</select>");
					html_cl("</div>");
				html_cl("</div>");
			html_cl("</div>");

			html();
			html_op("<div class=\"tile_right_block\">");
				if ($trans_type == 1)
				{
					getRightTileBlock("amount_left", FALSE, "Amount", "amount_b", "onAmountSelect();",
											Currency::format($tr["amount"], ($trans_type == 1) ? $src["curr"] : $dest["curr"]));
/*
					html_op("<div id=\"amount_left\" style=\"display: none;\">");
						html("<span>Amount</span>");
						html_op("<div>");
							html("<button id=\"amount_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onAmountSelect();\"><span>".Currency::format($tr["amount"], ($trans_type == 1) ? $src["curr"] : $dest["curr"])."</span></button>");
						html_cl("</div>");
					html_cl("</div>");
*/
				}

				if ($trans_type == 1 || $trans_type == 3)
				{
					getRightTileBlock("charge_left", FALSE, "Charge", "charge_b", "onChargeSelect();",
											Currency::format($tr["charge"], ($trans_type == 1) ? $src["curr"] : $dest["curr"]));
/*
					html_op("<div id=\"charge_left\" style=\"display: none;\">");
						html("<span>Charge</span>");
						html_op("<div>");
							html("<button id=\"charge_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onChargeSelect();\"><span>".Currency::format($tr["charge"], ($trans_type == 1) ? $src["curr"] : $dest["curr"])."</span></button>");
						html_cl("</div>");
					html_cl("</div>");
*/
				}

				$disp = (($trans_type == 3 && $src["curr"] == $dest["curr"]) ||
						(($trans_type == 1 || $trans_type == 2) && $transAccCur == $tr["curr"]));
				$disp = !$disp;
				getRightTileBlock("exch_left", $disp, "Exchange rate", "exchrate_b", "onExchRateSelect();",
											round($tr["amount"] / $tr["charge"], 5)." ".$charge_sign."/".$amount_sign);
/*
				$disp = ((($trans_type == 3 && $src["curr"] == $dest["curr"]) || (($trans_type == 1 || $trans_type == 2) && $transAccCur == $tr["curr"])) ? " style=\"display: none;\"" : "");
				html_op("<div id=\"exch_left\"".$disp.">");
					html("<span>Exchange rate</span>");
					html_op("<div>");
						html("<button id=\"exchrate_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onExchRateSelect();\"><span>".round($tr["amount"] / $tr["charge"], 5)." ".$charge_sign."/".$amount_sign."</span></button>");
					html_cl("</div>");
				html_cl("</div>");
*/

				getRightTileBlock("src_res_balance_left", TRUE, "Result balance", "resbal_b", "onResBalanceSelect();",
											Currency::format($src["balance"], $src["curr"]));
/*
				html_op("<div id=\"src_res_balance_left\">");
					html("<span>Result balance</span>");
					html_op("<div>");
						html("<button id=\"resbal_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onResBalanceSelect();\"><span>".Currency::format($src["balance"], $src["curr"])."</span></button>");
					html_cl("</div>");
				html_cl("</div>");
*/
			html_cl("</div>");
		html_cl("</div>");
	}

	if ($trans_type == 2 || $trans_type == 3)
	{
		html();
		html_op("<div id=\"destination\" class=\"acc_float\">");
				html("<div><label for=\"dest_id\">Destination account</label></div>");
				html_op("<div class=\"tile_container\">");
					html($acc->getDivTile($tr["dest_id"], "dest_tile"));
					html_op("<div class=\"acc_sel\">");
						html_op("<div>");
							html("<select id=\"dest_id\" name=\"dest_id\" onchange=\"".(($trans_type == 3) ? "onChangeDest" : "onChangeAcc")."();\">");
								echo($acc->getList($tr["dest_id"]));
							html_cl("</select>");
						html_cl("</div>");
					html_cl("</div>");
				html_cl("</div>");

				html();
				html_op("<div class=\"tile_right_block\">");
				if ($trans_type == 2)
				{
					getRightTileBlock("amount_left", FALSE, "Amount", "amount_b", "onAmountSelect();",
											Currency::format($tr["amount"], ($trans_type == 1) ? $src["curr"] : $dest["curr"]));
/*
					html_op("<div id=\"amount_left\" style=\"display: none;\">");
						html("<span>Amount</span>");
						html_op("<div>");
							html("<button id=\"amount_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onAmountSelect();\"><span>".Currency::format($tr["amount"], ($trans_type == 1) ? $src["curr"] : $dest["curr"])."</span></button>");
						html_cl("</div>");
					html_cl("</div>");
*/

					getRightTileBlock("charge_left", FALSE, "Charge", "charge_b", "onChargeSelect();",
											Currency::format($tr["charge"], ($trans_type == 1) ? $src["curr"] : $dest["curr"]));
/*
					html_op("<div id=\"charge_left\" style=\"display: none;\">");
						html("<span>Charge</span>");
						html_op("<div>");
							html("<button id=\"charge_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onChargeSelect();\"><span>".Currency::format($tr["charge"], ($trans_type == 1) ? $src["curr"] : $dest["curr"])."</span></button>");
						html_cl("</div>");
					html_cl("</div>");
*/

					getRightTileBlock("exch_left", FALSE, "Exchange rate", "exchrate_b", "onExchRateSelect();",
											round($tr["amount"] / $tr["charge"], 5)." ".$charge_sign."/".$amount_sign);
/*
					html_op("<div id=\"exch_left\" style=\"display: none;\">");
						html("<span>Exchange rate</span>");
						html_op("<div>");
							html("<button id=\"exchrate_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onExchRateSelect();\"><span>".round($tr["amount"] / $tr["charge"], 5)." ".$charge_sign."/".$amount_sign."</span></button>");
						html_cl("</div>");
					html_cl("</div>");
*/

					getRightTileBlock("src_res_balance_left", TRUE, "Result balance", "resbal_b", "onResBalanceSelect();",
											Currency::format($dest["balance"], $dest["curr"]));
/*
					html_op("<div id=\"src_res_balance_left\">");
						html("<span>Result balance</span>");
						html_op("<div>");
							html("<button id=\"resbal_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onResBalanceSelect();\"><span>".Currency::format($dest["balance"], $dest["curr"])."</span></button>");
						html_cl("</div>");
					html_cl("</div>");
*/
				}
				else if ($trans_type == 3)
				{
					getRightTileBlock("amount_left", FALSE, "Amount", "amount_b", "onAmountSelect();",
											Currency::format($tr["amount"], ($trans_type == 1) ? $src["curr"] : $dest["curr"]));
/*
					html_op("<div id=\"amount_left\" style=\"display: none;\">");
						html("<span>Amount</span>");
						html_op("<div>");
							html("<button id=\"amount_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onAmountSelect();\"><span>".Currency::format($tr["amount"], ($trans_type == 1) ? $src["curr"] : $dest["curr"])."</span></button>");
						html_cl("</div>");
					html_cl("</div>");
*/

					getRightTileBlock("dest_res_balance_left", TRUE, "Result balance", "resbal_d_b", "onResBalanceDestSelect();",
											Currency::format($dest["balance"], $dest["curr"]));
/*
					html_op("<div id=\"dest_res_balance_left\">");
						html("<span>Result balance</span>");
						html_op("<div>");
							html("<button id=\"resbal_d_b\" class=\"dashed_btn resbal_btn\" type=\"button\" onclick=\"onResBalanceDestSelect();\"><span>".Currency::format($dest["balance"], $dest["curr"])."</span></button>");
						html_cl("</div>");
					html_cl("</div>");
*/
				}
			html_cl("</div>");
		html_cl("</div>");
	}

	html();
	html_op("<div id=\"amount_row\" class=\"non_float\">");
		html_op("<div id=\"curr_block\" class=\"right_float\" style=\"display: none;\">");
			html("<div><label for=\"transcurr\">Currency</label></div>");
			html_op("<div class=\"stretch_input trans_input\">");
				html_op("<div class=\"currency_block\">");
					html_op("<select id=\"transcurr\" name=\"transcurr\" onchange=\"onChangeTransCurr(this);\">");
						echo(Currency::getList($tr["curr"]));
					html_cl("</select>");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");

		html();
		html_op("<div>");
			echo($tabStr."<div><label for=\"amount\">Amount</label>");
			echo("<button id=\"ancurrbtn\" class=\"dashed_btn curr_btn\" type=\"button\" onclick=\"showCurrList();\"");
			if ($trans_type == 3)
				echo(" style=\"display: none;\"");
			echo("><span>Select currency</span></button></div>\r\n");
			html_op("<div>");
				html("<div class=\"right_float\"><span id=\"amountsign\" class=\"curr_sign\">".$amount_sign."</span></div>");
				html_op("<div class=\"stretch_input trans_input\">");
					html_op("<div>");
						html("<input id=\"amount\" name=\"amount\" class=\"summ_text\" type=\"text\" value=\"".$tr["amount"]."\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
					html_cl("</div>");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");


	$disp = ((($trans_type == 3 && $src["curr"] == $dest["curr"]) || (($trans_type == 1 || $trans_type == 2) && $transAccCur == $tr["curr"])) ? " style=\"display: none;\"" : "");
	html();
	html_op("<div id=\"chargeoff\" class=\"non_float\"".$disp.">");
		html("<div><label for=\"charge\">Charge</label></div>");
		html_op("<div>");
			html("<div class=\"right_float\"><span id=\"chargesign\" class=\"curr_sign\">".$charge_sign."</span></div>");
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

	html();
	html_op("<div id=\"result_balance\" class=\"non_float\" style=\"display: none;\">");
		html("<div><label for=\"resbal\">Result balance".(($trans_type == 3) ? " (Source)" : "")."</label></div>");
		html_op("<div>");
			html("<div class=\"right_float\"><span id=\"res_currsign\" class=\"curr_sign\">".$src["sign"]."</span></div>");
			html_op("<div class=\"stretch_input trans_input\">");
				html_op("<div>");
					html("<input id=\"resbal\" class=\"summ_text\" type=\"text\" value=\"\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

	if ($trans_type == 3)
	{
		html();
		html_op("<div id=\"result_balance_dest\" class=\"non_float\" style=\"display: none;\">");
			html("<div><label for=\"resbal_d\">Result balance (Destination)</label></div>");
			html_op("<div>");
				html("<div class=\"right_float\"><span id=\"res_currsign\" class=\"curr_sign\">".$dest["sign"]."</span></div>");
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
		html_op("<div id=\"date_block\">");
			html("<div><label for=\"date\">Date</label></div>");
			html_op("<div>");
				html("<div class=\"right_float\"><div id=\"calendar_btn\" class=\"iconlink form_iconlink\"><button type=\"button\" onclick=\"showCalendar();\"><div class=\"calendar\"></div><span style=\"display: none;\">Change date</span></button></div></div>");
				html_op("<div class=\"stretch_input trans_input\">");
					html_op("<div>");
						html("<input id=\"date\" name=\"date\" type=\"text\" value=\"".(date("d.m.Y", strtotime($tr["date"])))."\">");
					html_cl("</div>");
				html_cl("</div>");
				html("<div id=\"calendar\" class=\"calWrap\" style=\"display: none;\"></div>");
				html("<script>buildCalendar();</script>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

	html();
	html_op("<div class=\"non_float\">");
		html("<div id=\"comm_btn\" class=\"iconlink form_iconlink\"".(($tr["comment"] == "") ? "" : " style=\"display: none;\"")."><button type=\"button\" onclick=\"showComment();\"><div class=\"add\"></div><span>Add comment</span></button></div>");
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
	html("</form>");
	html("</body>");
	html("</html>");
?>
