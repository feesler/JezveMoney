<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/person.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");
	require_once("./class/transaction.php");


	function fail()
	{
		setLocation("./index.php?newtrans=fail");
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


	$user_id = User::check();
	if (!$user_id)
		setLocation("./login.php");

	// check predefined type of transaction
	$type_str = (isset($_GET["type"])) ? $_GET["type"] : "expense";
	$trans_type = Transaction::getStringType($type_str);
	if (!$trans_type)
	{
		$type_str = "expense";
		$trans_type = Transaction::getStringType($type_str);
	}
	if (!$trans_type)
		fail();

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

	// check predefined account
	$acc_id = 0;
	if (isset($_GET["acc_id"]))
		$acc_id = intval($_GET["acc_id"]);

	if ($trans_type == 4)
	{
		$newDebtLocation = "./newdebt.php";
		if (!$acc_id || !$acc->is_exist($acc_id))
			$newDebtLocation .= "?acc_id=".$acc_id;
		setLocation($newDebtLocation);
	}

	if (!$acc_id || !$acc->is_exist($acc_id))		// TODO : think about redirect or warning message
		$acc_id = $acc->getIdByPos(0);
	if (!$acc_id)
		fail();

	$acc_count = $acc->getCount();

	// set source and destination accounts
	$src_id = 0;
	$dest_id = 0;
	if ($trans_type == 1 || $trans_type == 3)			// expense or transfer
		$src_id = ($acc_id ? $acc_id : $acc->getIdByPos(0));
	else if ($trans_type == 2)		// income
		$dest_id = ($acc_id ? $acc_id : $acc->getIdByPos(0));

	if ($trans_type == 3)
		$dest_id = getAnotherAccount($src_id);

	$src = getAccountProperties($src_id);
	$dest = getAccountProperties($dest_id);

	$titleString = "Jezve Money | New transaction";

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
	echo(Currency::getArray(TRUE));
	html("var trans_curr = ".(($trans_type == 1) ? $src["curr"] : $dest["curr"]).";");
	html("var trans_acc_curr = ".(($trans_type == 1) ? $src["curr"] : $dest["curr"]).";");

	html("var trans_type = ".$trans_type.";");
	html("var edit_mode = false;");
	html("</script>");

	html("</head>");
	html("<body>");

	require_once("./templates/header.php");

	html("<form method=\"post\" action=\"./modules/transaction.php?type=".$type_str."\" onsubmit=\"return ".(($trans_type == 3) ? "onTransferSubmit" : "onSubmit")."(this);\">");

	html_op("<div class=\"content\">");
		html_op("<div class=\"content_wrap\">");
			html("<h2>Create new transaction</h2>");
			html_op("<div>");
				$acc_par = (($acc_id != 0) ? "&amp;acc_id=".$acc_id : "");
				$d_acc_par = (($acc_id != 0) ? "?acc_id=".$acc_id : "");
				$newTransMenu = array(array(1, "Expense", "./newtransaction.php?type=expense".$acc_par),
										array(2, "Income", "./newtransaction.php?type=income".$acc_par),
										array(3, "Transfer", "./newtransaction.php?type=transfer".$acc_par),
										array(4, "Debt", "./newdebt.php".$d_acc_par));
				showSubMenu($trans_type, $newTransMenu);

if ($acc_count < 2 && $trans_type == 3)
{
	html("<div class=\"align_block\"><span>You need at lease two accounts for transfer.</span></div>");
}
else if (!$acc_count && $trans_type != 3)
{
	html("<div class=\"align_block\"><span>You have no one account. Please create one.</span></div>");
}
else
{

	if ($trans_type == 1 || $trans_type == 3)
	{
		html_op("<div id=\"source\" class=\"acc_float\">");
			html("<div><label for=\"src_id\">Source account</label></div>");
			html_op("<div class=\"tile_container\">");
				html($acc->getTile(STATIC_TILE, $src_id, "source_tile"));
				html_op("<div class=\"acc_sel\">");
					html_op("<div>");
						html_op("<select id=\"src_id\" name=\"src_id\" onchange=\"".(($trans_type == 3) ? "onChangeSource" : "onChangeAcc")."();\">");
							echo($acc->getList($src_id));
						html_cl("</select>");
					html_cl("</div>");
				html_cl("</div>");
			html_cl("</div>");

			html();
			html_op("<div class=\"tile_right_block\">");

				if ($trans_type == 1)
				{
					getRightTileBlock("amount_left", FALSE, "Amount", "amount_b", "onAmountSelect();",
											Currency::format(0, ($trans_type == 1) ? $src["curr"] : $dest["curr"]));
				}

				if ($trans_type == 1 || $trans_type == 3)
				{
					getRightTileBlock("charge_left", FALSE, "Charge", "charge_b", "onChargeSelect();",
											Currency::format(0, ($trans_type == 1) ? $src["curr"] : $dest["curr"]));
				}

				$disp = ($trans_type == 3 && $src["curr"] != $dest["curr"]);
				getRightTileBlock("exch_left", $disp, "Exchange rate", "exchrate_b", "onExchRateSelect();",
											"1 ".$src["sign"]."/".$dest["sign"]);

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
				html($acc->getTile(STATIC_TILE, $dest_id, "dest_tile"));
				html_op("<div class=\"acc_sel\">");
					html_op("<div>");
						html_op("<select id=\"dest_id\" name=\"dest_id\" onchange=\"".(($trans_type == 3) ? "onChangeDest" : "onChangeAcc")."();\">");
							echo($acc->getList($dest_id));
						html_cl("</select>");
					html_cl("</div>");
				html_cl("</div>");
			html_cl("</div>");

			html();
			html_op("<div class=\"tile_right_block\">");

				getRightTileBlock("amount_left", FALSE, "Amount", "amount_b", "onAmountSelect();",
										Currency::format(0, ($trans_type == 1) ? $src["curr"] : $dest["curr"]));
				if ($trans_type == 2)
				{
					getRightTileBlock("charge_left", FALSE, "Charge", "charge_b", "onChargeSelect();", "");
					getRightTileBlock("exch_left", FALSE, "Exchange rate", "exchrate_b", "onExchRateSelect();",
											"1 ".$src["sign"]."/".$dest["sign"]);
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
				html("<div class=\"".$currBtnClass."\"><div id=\"amountsign\">".(($trans_type == 1) ? $src["sign"] : $dest["sign"])."</div></div>");

				$disp = ($trans_type == 3) ? " style=\"display: none;\"" : "";
				html_op("<div class=\"rcurr_sel\"".$disp.">");
					html_op("<div>");
						html_op("<select id=\"transcurr\" name=\"transcurr\" onchange=\"onChangeTransCurr(this);\">");
							echo(Currency::getList(($trans_type == 2) ? $dest["curr"] : $src["curr"]));
						html_cl("</select>");
					html_cl("</div>");
				html_cl("</div>");
			html_cl("</div>");

			$inputType = ($trans_type == 3) ? "trans_input" : "rbtn_input";
			html_op("<div class=\"stretch_input ".$inputType."\">");
				html_op("<div>");
					html("<input id=\"amount\" name=\"amount\" class=\"summ_text\" type=\"text\" value=\"\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");
	html_cl("</div>");

	$disp = (($trans_type != 3 || ($trans_type == 3 && $src["curr"] == $dest["curr"])) ? " style=\"display: none;\"" : "");
	html();
	html_op("<div id=\"chargeoff\" class=\"non_float\"".$disp.">");
		html("<div><label for=\"charge\">Charge</label></div>");
		html_op("<div>");
			html("<div class=\"curr_container\"><div class=\"btn rcurr_btn inact_rbtn\"><div id=\"chargesign\">".$src["sign"]."</div></div></div>");
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
			html("<div class=\"right_float\"><span id=\"exchcomm\" class=\"exchrate_comm\">".$src["sign"]."/".$dest["sign"]."</span></div>");
			html_op("<div class=\"stretch_input trans_input\">");
				html_op("<div>");
					html("<input id=\"exchrate\" class=\"summ_text\" type=\"text\" value=\"1\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
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
				html("<div class=\"curr_container\"><div class=\"btn rcurr_btn inact_rbtn\"><div id=\"res_currsign_d\">".$dest["sign"]."</div></div></div>");
				html_op("<div class=\"stretch_input trans_input\">");
					html_op("<div>");
						html("<input id=\"resbal_d\" class=\"summ_text\" type=\"text\" value=\"\" oninput=\"return onFInput(this);\" onkeypress=\"return onFieldKey(event, this);\">");
					html_cl("</div>");
				html_cl("</div>");
			html_cl("</div>");
		html_cl("</div>");
	}

	html();
	html_op("<div class=\"non_float\">");
		$today = date("d.m.Y");
		html(getIconLink(ICON_BUTTON, "calendar_btn", "calendar", "Change date", TRUE, "showCalendar();", "form_iconlink", $today));
		html_op("<div id=\"date_block\" style=\"display: none;\">");
			html("<div><label for=\"date\">Date</label></div>");
			html_op("<div>");
				html_op("<div class=\"right_float\">");
					html("<button id=\"cal_rbtn\" class=\"btn cal_btn\" type=\"button\" onclick=\"showCalendar();\"><div></div></button>");
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
		html(getIconLink(ICON_BUTTON, "comm_btn", "add", "Add comment", TRUE, "showComment();", "form_iconlink"));
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
	html("</form>");
	html("</body>");
	html("</html>");
?>
