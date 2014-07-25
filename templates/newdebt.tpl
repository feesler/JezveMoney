<?php	include("./templates/commonhdr.tpl");	?>
<script>
	var lastAcc_id = <?=$acc_id?>;
	var accounts = <?=f_json_encode($accArr)?>;
	var currency = <?=f_json_encode($currArr)?>;
	var trans_curr = <?=$debtAcc["curr"]?>;
	var trans_acc_curr = <?=$debtAcc["curr"]?>;
	var noAccount = false;
	var persons = <?=f_json_encode($persArr)?>;
	var trans_type = <?=$trans_type?>;
	var debtType = <?=($give ? "true" : "false")?>;		// true - give, false - take
	var edit_mode = false;

	onReady(initControls);
</script>
</head>
<body>
<form method="post" action="./modules/debt.php" onsubmit="return onDebtSubmit(this);">
<div class="page">
	<div class="page_wrapper">
<?php	require_once("./templates/header.tpl");		?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<h2>Create new debt</h2>
					<div>
						<div id="trtype_menu" class="subHeader">
<?php	forEach($transMenu as $menuItem) {
			if ($menuItem[0] == $trans_type) {		?>
							<span><b><?=$menuItem[1]?></b></span>
<?php		} else {		?>
							<span><a href="<?=$menuItem[2]?>"><?=$menuItem[1]?></a></span>
<?php		}
		}	?>
						</div>
<?php	if (!$acc_count) {		?>
						<div class="align_block"><span>You have no one account. Please create one.</span></div>
<?php	} else {		?>
						<div id="person" class="acc_float">
							<input id="person_id" name="person_id" type="hidden" value="<?=$fperson_id?>">
							<div><label>Person name</label></div>
							<div>
								<div class="tile_container">
<?php	if (!$person->getCount()) {		?>
									<div id="person_tile inact" class="tile"><div class="tilelink"><span><span class="acc_bal"><?=$fp_balfmt?></span><span class="acc_name"></span></span></div></div>
<?php	} else {	?>
									<div id="person_tile" class="tile"><div class="tilelink"><span><span class="acc_bal"><?=$fp_balfmt?></span><span class="acc_name"><?=$fperson_name?></span></span></div></div>
<?php	}		?>
								</div>

								<div class="tile_right_block">
									<div id="amount_left" style="display: none;">
										<span>Amount</span>
										<div>
											<button id="amount_b" class="dashed_btn resbal_btn" type="button" onclick="onAmountSelect();"><span><?=$rtAmount?></span></button>
										</div>
									</div>
									<div id="exch_left" style="display: none;">
										<span>Exchange rate</span>
										<div>
											<button id="exchrate_b" class="dashed_btn resbal_btn" type="button" onclick="onExchRateSelect();"><span><?=$rtExchange?></span></button>
										</div>
									</div>
									<div id="src_res_balance_left">
										<span>Result balance</span>
										<div>
											<button id="resbal_b" class="dashed_btn resbal_btn" type="button" onclick="onResBalanceSelect();"><span><?=$rtSrcResBal?></span></button>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div id="source" class="acc_float">
							<div class="tile_header"><label id="acclbl"><?=$accLbl?></label><div id="noacc_btn" class="iconlink small_icon"><button onclick="toggleEnableAccount();" type="button"><span class="icon close_gray"></span></button></div></div>
							<div class="tile_container">
								<div id="acc_tile" class="tile<?=$debtAcc["iconclass"]?>"><div class="tilelink"><span><span class="acc_bal"><?=$debtAcc["balfmt"]?></span><span class="acc_name"><?=$debtAcc["name"]?></span></span></div></div>
								<input id="acc_id" name="acc_id" type="hidden" value="<?=$acc_id?>">
							</div>

							<div class="tile_right_block">
								<div id="charge_left" style="display: none;">
									<span>Charge</span>
									<div>
										<button id="charge_b" class="dashed_btn resbal_btn" type="button" onclick="onChargeSelect();"><span><?=$rtCharge?></span></button>
									</div>
								</div>
								<div id="dest_res_balance_left">
									<span>Result balance</span>
									<div>
										<button id="resbal_d_b" class="dashed_btn resbal_btn" type="button" onclick="onResBalanceDestSelect();"><span><?=$rtDestResBal?></span></button>
									</div>
								</div>
							</div>

							<div id="selaccount" class="selacc_container" style="display: none;">
								<button class="dashed_btn resbal_btn" type="button" onclick="toggleEnableAccount();"><span>Select account</span></button>
							</div>
						</div>

						<div id="operation" class="non_float">
							<div><label>Operation</label></div>
							<div class="op_sel">
								<input id="debtgive" name="debtop" type="radio" value="1" onchange="onChangeDebtOp();" checked><span>give</span>
								<input id="debttake" name="debtop" type="radio" value="2" onchange="onChangeDebtOp();"><span>take</span>
							</div>
						</div>

						<div id="amount_row" class="non_float">
							<div><label for="amount">Amount</label></div>
							<div>
								<div class="curr_container">
									<div class="btn rcurr_btn"><div id="amountsign"><?=$amountSign?></div></div>
									<input id="transcurr" name="transcurr" type="hidden" value="<?=$debtAcc["curr"]?>">
								</div>
					
								<div class="stretch_input rbtn_input">
									<div>
										<input id="amount" name="amount" class="summ_text" type="text" value="" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
									</div>
								</div>
							</div>
						</div>

						<div id="chargeoff" class="non_float" style="display: none;">
							<div><label for="charge">Charge</label></div>
							<div>
								<div class="curr_container"><div class="btn rcurr_btn inact_rbtn"><div id="chargesign"><?=$chargeSign?></div></div></div>
								<div class="stretch_input trans_input">
									<div>
										<input id="charge" name="charge" class="summ_text" type="text" value="" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
									</div>
								</div>
							</div>
						</div>

						<div id="exchange" class="non_float" style="display: none;">
							<div><label for="exchrate">Exchange rate</label></div>
							<div>
								<div class="right_float"><span id="exchcomm" class="exchrate_comm"><?=$exchSign?></span></div>
								<div class="stretch_input trans_input">
									<div>
										<input id="exchrate" class="summ_text" type="text" value="1" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
									</div>
								</div>
							</div>
						</div>

						<div id="result_balance" class="non_float" style="display: none;">
							<div><label for="resbal">Result balance (Person)</label></div>
							<div>
								<div class="curr_container"><div class="btn rcurr_btn inact_rbtn"><div id="res_currsign"><?=$debtAcc["sign"]?></div></div></div>
								<div class="stretch_input trans_input">
									<div>
										<input id="resbal" class="summ_text" type="text" value="" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
									</div>
								</div>
							</div>
						</div>

						<div id="result_balance_dest" class="non_float" style="display: none;">
							<div><label for="resbal_d">Result balance (Account)</label></div>
							<div>
								<div class="curr_container"><div class="btn rcurr_btn inact_rbtn"><div id="res_currsign_d"><?=$debtAcc["sign"]?></div></div></div>
								<div class="stretch_input trans_input">
									<div>
										<input id="resbal_d" class="summ_text" type="text" value="" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
									</div>
								</div>
							</div>
						</div>

						<div class="non_float">
							<div id="calendar_btn" class="iconlink std_margin"><button onclick="showCalendar();" type="button"><span class="icon calendar"></span><span class="icontitle"><span class="maintitle">Change date</span><span class="addtitle"><?=$today?></span></span></button></div>
							<div id="date_block" style="display: none;">
								<div><label for="date">Date</label></div>
								<div>
									<div class="right_float">
										<button id="cal_rbtn" class="btn icon_btn cal_btn" type="button" onclick="showCalendar();"><span></span></button>
									</div>
									<div class="stretch_input rbtn_input">
										<div>
											<input id="date" name="date" type="text" value="<?=$today?>">
										</div>
									</div>
									<div id="calendar" class="calWrap" style="display: none;"></div>
								</div>
							</div>
						</div>

						<div class="non_float">
							<div id="comm_btn" class="iconlink std_margin"><button onclick="showComment();" type="button"><span class="icon add"></span><span class="icontitle"><span>Add comment</span></span></button></div>
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
<?php	}	?>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
</form>
</body>
</html>
