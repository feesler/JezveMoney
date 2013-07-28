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

		html("<div id=\"trtype_menu\" class=\"subHeader\">");
		pushTab();

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

		popTab();
		html("</div>");
	}


	$user_id = User::check();
	if (!$user_id)
		setLocation("./login.php");

	// check predefined type of transaction
	$type_str = (isset($_GET["type"])) ? $_GET["type"] : "expense";
	$trans_type = Transaction::getStringType($type_str);
	if (!$trans_type)
		fail();

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

	// check predefined account
	$acc_id = 0;
	if (isset($_GET["acc_id"]))
		$acc_id = intval($_GET["acc_id"]);
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
?>
<!DOCTYPE html>
<html>
<head>
<?php
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

	html("<script>");
	echo($acc->getArray());
	echo(Currency::getArray());
	if ($trans_type == 1 || $trans_type == 2)
	{
		html("var trans_curr = ".(($trans_type == 1) ? $src["curr"] : $dest["curr"]).";");
		html("var trans_acc_curr = ".(($trans_type == 1) ? $src["curr"] : $dest["curr"]).";");
	}

	html("var trans_type = ".$trans_type.";");
	html("var edit_mode = false;");
	html("</script>");
?>
</head>
<body>
<?php
	require_once("./templates/header.php");

	html("<form method=\"post\" action=\"./modules/transaction.php?type=".$type_str."\" onsubmit=\"return ".(($trans_type == 3) ? "onTransferSubmit" : "onSubmit")."(this);\">");
?>
<div class="tr_content">
	<div>
		<h2>Create new transaction</h2>
		<div>
<?php
	setTab(3);
	showSubMenu();

	setTab(3);
	if ($trans_type == 1 || $trans_type == 3)		// expense or transfer
		html("<div id=\"source\" class=\"acc_float\">");
	else
		html("<div id=\"source\" class=\"acc_float\" style=\"display: none;\">");
?>
				<div><label for="src_id">Source account</label></div>
				<div class="tile_container">
<?php
	setTab(5);
	html($acc->getDivTile($src_id, "source_tile"));
?>
					<div class="acc_sel">
						<div>
<?php
	setTab(7);
	html("<select id=\"src_id\" name=\"src_id\" onchange=\"".(($trans_type == 3) ? "onChangeSource" : "onChangeAcc")."();\">");
	pushTab();
	echo($acc->getList($src_id));
	popTab();
	html("</select>");
?>
						</div>
					</div>
				</div>
				<div class="tile_right_block">
					<div id="src_amount_left" style="display: none;">
						<span>Amount</span>
						<div>
							<button id="amount_b" class="dashed_btn resbal_btn" type="button" onclick="onAmountSelect();"><span><?php echo("0 ".($trans_type == 1) ? $src["sign"] : $dest["sign"]); ?></span></button>
						</div>
					</div>

<?php
	$disp = (($trans_type != 3 || ($trans_type == 3 && $src["curr"] == $dest["curr"])) ? " style=\"display: none;\"" : "");
	setTab(5);
	html("<div id=\"exch_left\"".$disp.">");
?>
						<span>Exchange rate</span>
						<div>
							<button id="exchrate_b" class="dashed_btn resbal_btn" type="button" onclick="onExchRateSelect();"><span><?php echo("1 ".$src["sign"]."/".$dest["sign"]); ?></span></button>
						</div>
					</div>

					<div id="src_res_balance_left">
						<span>Result balance</span>
						<div>
							<button id="resbal_b" class="dashed_btn resbal_btn" type="button" onclick="onResBalanceSelect();"><span><?php echo(Currency::format($src["balance"], $src["curr"])); ?></span></button>
						</div>
					</div>
				</div>
			</div>

<?php
	setTab(3);
	if ($trans_type == 2 || $trans_type == 3)		// income or transfer
		html("<div id=\"destination\" class=\"acc_float\">");
	else
		html("<div id=\"destination\" class=\"acc_float\" style=\"display: none;\">");
?>
				<div><label for="dest_id">Destination account</label></div>
				<div class="tile_container">
<?php
	setTab(5);
	html($acc->getDivTile($dest_id, "dest_tile"));
?>
					<div class="acc_sel">
						<div>
<?php
	setTab(7);
	html("<select id=\"dest_id\" name=\"dest_id\" onchange=\"".(($trans_type == 3) ? "onChangeDest" : "onChangeAcc")."();\">");
	pushTab();
	echo($acc->getList($dest_id));
	popTab();
	html("</select>");
?>
						</div>
					</div>
				</div>
				<div class="tile_right_block">
					<div id="dest_charge_left" style="display: none;">
						<span>Charge</span>
						<div>
							<button id="charge_b" class="dashed_btn resbal_btn" type="button" onclick="onChargeSelect();"><span></span></button>
						</div>
					</div>

					<div id="dest_res_balance_left">
						<span>Result balance</span>
						<div>
							<button id="resbal_d_b" class="dashed_btn resbal_btn" type="button" onclick="onResBalanceDestSelect();"><span><?php echo(Currency::format($dest["balance"], $dest["curr"])); ?></span></button>
						</div>
					</div>
				</div>
			</div>

			<div id="amount_row" class="non_float">
				<div id="curr_block" class="right_float" style="display: none;">
					<div><label for="transcurr">Currency</label></div>
					<div class="stretch_input trans_input">
						<div class="currency_block">
							<select id="transcurr" name="transcurr" onchange="onChangeTransCurr(this);">
<?php
	setTab(8);
	echo(Currency::getList($src["curr"]));
	popTab();
?>
							</select>
						</div>
					</div>
				</div>

				<div>
<?php
	setTab(5);
	echo($tabStr."<div><label for=\"amount\">Amount</label>");
	echo("<button id=\"ancurrbtn\" class=\"dashed_btn curr_btn\" type=\"button\" onclick=\"showCurrList();\"");
	if ($trans_type == 3)
		echo(" style=\"display: none;\"");
	echo("><span>Select currency</span></button></div>\r\n");
?>
					<div>
						<div class="right_float"><span id="amountsign" class="curr_sign"><?php echo(($trans_type == 1) ? $src["sign"] : $dest["sign"]) ?></span></div>
						<div class="stretch_input trans_input">
							<div>
								<div onclick="onAmountSelect();" style="display: none;"><span id="amount_l" class="summ_text"></span></div>
								<input id="amount" name="amount" class="summ_text" type="text" value="" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
							</div>
						</div>
					</div>
				</div>
			</div>

<?php
	$disp = (($trans_type != 3 || ($trans_type == 3 && $src_curr == $dest_curr)) ? " style=\"display: none;\"" : "");
	setTab(3);
	html("<div id=\"chargeoff\" class=\"non_float\"".$disp.">");
?>
				<div><label for="charge">Charge</label></div>
				<div>
					<div class="right_float"><span id="chargesign" class="curr_sign"><?php echo($src["sign"]); ?></span></div>
					<div class="stretch_input trans_input">
						<div>
							<div onclick="onChargeSelect();" style="display: none;"><span id="charge_l" class="summ_text"></span></div>
							<input id="charge" name="charge" class="summ_text" type="text" value="" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
						</div>
					</div>
				</div>
			</div>

<?php
	$disp = (($trans_type != 3 || ($trans_type == 3 && $src["curr"] == $dest["curr"])) ? " style=\"display: none;\"" : "");
	setTab(3);
	html("<div id=\"exchange\" class=\"non_float\"".$disp.">");
?>
				<div><label for="exchrate">Exchange rate</label></div>
				<div>
					<div class="right_float"><span id="exchcomm" class="exchrate_comm"><?php echo($src["sign"]."/".$dest["sign"]); ?></span></div>
					<div class="stretch_input trans_input">
						<div class="dashed_static">
							<div onclick="onExchRateSelect();"><span id="exchrate_l" class="summ_text">1</span></div>
							<input id="exchrate" name="exchrate" class="summ_text" type="text" value="1" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);" style="display: none;">
						</div>
					</div>
				</div>
			</div>

			<div id="result_balance" class="non_float" style="display: none;">
				<div><label for="resbal">Result balance<? if ($trans_type == 3) echo(" (Source)"); ?></label></div>
				<div>
					<div class="right_float"><span id="res_currsign" class="curr_sign"><?php echo($src["sign"]); ?></span></div>
					<div class="stretch_input trans_input">
						<div class="dashed_static">
							<div onclick="onResBalanceSelect();"><span id="resbal_l" class="summ_text"></span></div>
							<input id="resbal" name="resbal" class="summ_text" type="text" value="" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);" style="display: none;">
						</div>
					</div>
				</div>
			</div>

			<div id="result_balance_dest" class="non_float" style="display: none;">
				<div><label for="resbal_d">Result balance<? if ($trans_type == 3) echo(" (Destination)"); ?></label></div>
				<div>
					<div class="right_float"><span id="res_currsign" class="curr_sign"><?php echo($dest["sign"]); ?></span></div>
					<div class="stretch_input trans_input">
						<div class="dashed_static">
							<div onclick="onResBalanceDestSelect();"><span id="resbal_d_l" class="summ_text"></span></div>
							<input id="resbal_d" class="summ_text" type="text" value="" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);" style="display: none;">
						</div>
					</div>
				</div>
			</div>

			<div class="non_float">
				<div id="calendar_btn" class="iconlink form_iconlink"><button type="button" onclick="showCalendar();"><div class="calendar"></div><span>Change date</span></button></div>
				<div id="date_block" style="display: none;">
					<div><label for="date">Date</label></div>
					<div>
						<div class="right_float"></div>
						<div class="stretch_input trans_input">
							<div>
								<input id="date" name="date" type="text" value="<?php echo(date("d.m.Y")); ?>">
							</div>
						</div>
						<div id="calendar" class="calWrap" style="display: none;"></div>
						<script>buildCalendar();</script>
					</div>
				</div>
			</div>

			<div class="non_float">
				<div id="comm_btn" class="iconlink form_iconlink"><button type="button" onclick="showComment();"><div class="add"></div><span>Add comment</span></button></div>
				<div id="comment_block" style="display: none;">
					<div><label for="comm">Comment</label></div>
					<div>
						<div class="stretch_input trans_input">
							<div>
								<input id="comm" name="comm" type="text" value="">
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="acc_controls"><input id="submitbtn" class="btn ok_btn" type="submit" value="ok"><a class="btn cancel_btn" href="./accounts.php">cancel</a></div>
		</div>
	</div>
</div>
</form>
</body>
</html>