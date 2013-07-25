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
	if (!$acc_id)
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
	html(getCSS("login.css"));
	html(getCSS("tiles.css"));
	html(getCSS("iconlink.css"));
	html(getCSS("calendar.css"));
?>
<style>
.std_btn
{
	height: 34px;
	font-size: 16px;
	font-weight: normal;
	padding: 2px 5px;
	background-color: #FFFFFF;
	color: #000000;
	border: 2px solid #000000;
}


/* dashed underline button */
.dashed_btn
{
	margin: 0 0 8px 0;
	border: 0 none;
	clear: both;
	cursor: pointer;
	background-color: #FFFFFF;
}


.dashed_btn > span
{
	color: #0072C6;
	padding: 0;
	margin-top: -10px;
	border-top: 0 none;
	border-right: 0 none;
	border-left: 0 none;
	border-bottom: 1px dashed #0072C6;	/* TODO : try png background */
}


.dashed_btn:hover > span
{
	border-bottom: 1px solid #0072C6;
}


/* select currency button */
.curr_btn
{
	padding: 0px 5px;
}

.curr_btn > span
{
	font-size: 12px;
}


/* result balance button */
.resbal_btn
{
	font-size: 16px;
}


.form_iconlink
{
	margin: 9px 5px;
}


.inv_result
{
	color: red;
}


/* seems to be the same as .profile_common */
.tr_content > div
{
	max-width: 300px;
	margin: 30px 5px 5px 25px;
}


.tr_content > div > h2
{
	font-size: 20px;
	font-weight: normal;
	margin: 2px 5px;
}


.tr_content label
{
	width: 150px;
	height: 20px;
	line-height: 20px;
	padding: 0px 5px;
	font-size: 14px;
}


.acc_sel
{
	position: absolute;
	opacity: 0;
}


.acc_sel > div > select
{
	width: 100px;
	height: 100px;
}


.tile_container
{
	padding: 0px 5px;
}


.tile_right_block
{
	height: 100px;
	margin: 0px 0px 10px 0px;
	overflow: hidden;
}
</style>
<?php
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
		html("<div id=\"source\">");
	else
		html("<div id=\"source\" style=\"display: none;\">");
?>
				<label for="src_id">Source account</label>
				<div class="tile_container">
<?php
	setTab(5);
	html($acc->getButtonTile($src_id));
?>
					<div class="acc_sel">
						<div>
<?php
	setTab(6);
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
					<div id="src_res_balance_left">
						<span>Result balance</span>
						<div>
							<button id="resbal_b" class="dashed_btn resbal_btn" type="button" onclick="onResBalanceSelect();"><span><?php echo($src["balance"]); ?></span></button>
						</div>
					</div>

					<div id="src_amount_left" style="display: none;">
						<span>Amount</span>
						<div>
							<button id="amount_b" class="dashed_btn resbal_btn" type="button" onclick="onAmountSelect();"><span></span></button>
						</div>
					</div>
				</div>
			</div>

<?php
	setTab(3);
	if ($trans_type == 2 || $trans_type == 3)		// income or transfer
		html("<div id=\"destination\">");
	else
		html("<div id=\"destination\" style=\"display: none;\">");
?>
				<label for="dest_id">Destination account</label>
				<div class="tile_container">
<?php
	echo($acc->getButtonTile($dest_id));
?>
					<div class="acc_sel">
						<div>
<?php
	setTab(6);
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
					<div id="dest_res_balance_left">
						<span>Result balance</span>
						<div>
							<button id="resbal_d_b" class="dashed_btn resbal_btn" type="button" onclick="onResBalanceDestSelect();"><span><?php echo($dest["balance"]); ?></span></button>
						</div>
					</div>
					<div id="dest_charge_left" style="display: none;">
						<span>Charge</span>
						<div>
							<button id="charge_b" class="dashed_btn resbal_btn" type="button" onclick="onChargeSelect();"><span></span></button>
						</div>
					</div>
				</div>
			</div>

			<div>
				<div id="curr_block" style="float: right; display: none;">
					<label for="transcurr">Currency</label>
					<div class="rdiv">
						<div class="currency_block">
							<select id="transcurr" name="transcurr" onchange="onChangeTransCurr(this);">
<?php
	setTab(8);
	echo(Currency::getList());
	popTab();
?>
							</select>
						</div>
					</div>
				</div>

				<div>
<?php
	setTab(5);
	echo($tabStr."<label for=\"amount\">Amount</label>");
	echo("<button id=\"ancurrbtn\" class=\"dashed_btn curr_btn\" type=\"button\" onclick=\"showCurrList();\"");
	if ($trans_type == 3)
		echo(" style=\"display: none;\"");
	echo("><span>Select currency</span></button>\r\n");
?>
					<div>
						<div class="rtext"><span id="amountsign" class="curr_sign"><?php echo(($trans_type == 1) ? $src["sign"] : $dest["sign"]) ?></span></div>
						<div class="rdiv">
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
	html("<div id=\"chargeoff\"".$disp.">");
?>
				<label for="charge">Charge</label>
				<div>
					<div class="rtext"><span id="ch_currsign" class="curr_sign"><?php echo($src["sign"]); ?></span></div>
					<div class="rdiv">
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
	html("<div id=\"exchange\"".$disp.">");
?>
				<label for="exchrate">Exchange rate</label>
				<div>
					<div class="rtext"><span id="exchcomm" style="margin-left: 5px;"></span></div>
					<div class="rdiv">
						<div class="balance_block">
							<div onclick="onExchRateSelect();"><span id="exchrate_l" class="summ_text">1</span></div>
							<input id="exchrate" name="exchrate" class="summ_text" type="text" value="1" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);" style="display: none;">
						</div>
					</div>
				</div>
			</div>

			<div id="result_balance" style="display: none;">
				<label for="resbal">Result balance<? if ($trans_type == 3) echo(" (Source)"); ?></label>
				<div>
					<div class="rtext"><span id="res_currsign" class="curr_sign"><?php echo($src["sign"]); ?></span></div>
					<div class="rdiv">
						<div class="balance_block">
							<div onclick="onResBalanceSelect();"><span id="resbal_l" class="summ_text"></span></div>
							<input id="resbal" name="resbal" class="summ_text" type="text" value="" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);" style="display: none;">
						</div>
					</div>
				</div>
			</div>

			<div id="result_balance_dest" style="display: none;">
				<label for="resbal_d">Result balance<? if ($trans_type == 3) echo(" (Destination)"); ?></label>
				<div>
					<div class="rtext"><span id="res_currsign" class="curr_sign"><?php echo($dest["sign"]); ?></span></div>
					<div class="rdiv">
						<div class="balance_block">
							<div onclick="onResBalanceDestSelect();"><span id="resbal_d_l" class="summ_text"></span></div>
							<input id="resbal_d" class="summ_text" type="text" value="" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);" style="display: none;">
						</div>
					</div>
				</div>
			</div>

			<div style="clear: both;">
				<div id="calendar_btn" class="iconlink form_iconlink"><button type="button" onclick="showCalendar();"><div class="calendar"></div><span>Change date</span></button></div>
				<div id="date_block" style="display: none;">
					<label for="date">Date</label>
					<div>
						<div class="rtext"></div>
						<div class="rdiv">
							<div>
								<input id="date" name="date" type="text" value="<?php echo(date("d.m.Y")); ?>">
							</div>
						</div>
						<div id="calendar" class="calWrap" style="display: none;"></div>
						<script>buildCalendar();</script>
					</div>
				</div>
			</div>

			<div style="clear: both;">
				<div id="comm_btn" class="iconlink form_iconlink"><button type="button" onclick="showComment();"><div class="add"></div><span>Add comment</span></button></div>
				<div id="comment_block" style="display: none;">
					<label for="comm">Comment</label>
					<div>
						<div class="rdiv">
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