<?php	include("./templates/commonhdr.tpl");	?>
<script>
	var accounts = <?=f_json_encode($acc->getArray())?>;
	var currency = <?=f_json_encode($currArr)?>;
	var trans_curr = <?=$transCurr?>;
	var trans_acc_curr = <?=$transAccCurr?>;
	var trans_type = <?=$trans_type?>;
	var edit_mode = false;

	onReady(initControls);
</script>
</head>
<body>
<form method="post" action="./modules/transaction.php?type=<?=$type_str?>" onsubmit="<?=$onFormSubmit?>">
<div class="page">
	<div class="page_wrapper">
<?php	require_once("./templates/header.tpl");	?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<h2>Create new transaction</h2>
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
<?php	if ($acc_count < 2 && $trans_type == 3) {	?>
						<div class="align_block"><span>You need at lease two accounts for transfer.</span></div>
<?php	} else if (!$acc_count && $trans_type != 3) {		?>
						<div class="align_block"><span>You have no one account. Please create one.</span></div>
<?php	} else {		?>
<?php	if ($trans_type == 1 || $trans_type == 3) {		?>
						<div id="source" class="acc_float">
							<div><label>Source account</label></div>
							<div class="tile_container">
								<div id="source_tile" class="tile<?=$src["iconclass"]?>"><div class="tilelink"><span><span class="acc_bal"><?=$src["balfmt"]?></span><span class="acc_name"><?=$src["name"]?></span></span></div></div>
								<input id="src_id" name="src_id" type="hidden" value="<?=$src_id?>">
							</div>

							<div class="tile_right_block">
<?php	if ($trans_type == 1) {		?>
								<div id="amount_left" style="display: none;">
									<span>Amount</span>
									<div>
										<button id="amount_b" class="dashed_btn resbal_btn" type="button" onclick="onAmountSelect();"><span><?=$rtAmount?></span></button>
									</div>
								</div>
<?php	}	?>
<?php	if ($trans_type == 1 || $trans_type == 3) {		?>
								<div id="charge_left" style="display: none;">
									<span>Charge</span>
									<div>
										<button id="charge_b" class="dashed_btn resbal_btn" type="button" onclick="onChargeSelect();"><span><?=$rtCharge?></span></button>
									</div>
								</div>
<?php	}	?>
<?php	if ($trans_type == 3 && $src["curr"] != $dest["curr"]) {		?>
								<div id="exch_left">
<?php	} else {	?>
								<div id="exch_left" style="display: none;">
<?php	}	?>
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
<?php	}	?>

<?php	if ($trans_type == 2 || $trans_type == 3) {		?>
						<div id="destination" class="acc_float">
							<div><label>Destination account</label></div>
							<div class="tile_container">
								<div id="dest_tile" class="tile<?=$dest["iconclass"]?>"><div class="tilelink"><span><span class="acc_bal"><?=$dest["balfmt"]?></span><span class="acc_name"><?=$dest["name"]?></span></span></div></div>
								<input id="dest_id" name="dest_id" type="hidden" value="<?=$dest_id?>">
							</div>

							<div class="tile_right_block">
								<div id="amount_left" style="display: none;">
									<span>Amount</span>
									<div>
										<button id="amount_b" class="dashed_btn resbal_btn" type="button" onclick="onAmountSelect();"><span><?=$rtAmount?></span></button>
									</div>
								</div>
<?php	if ($trans_type == 2) {		?>
								<div id="charge_left" style="display: none;">
									<span>Charge</span>
									<div>
										<button id="charge_b" class="dashed_btn resbal_btn" type="button" onclick="onChargeSelect();"><span><?=$rtCharge?></span></button>
									</div>
								</div>
								<div id="exch_left" style="display: none;">
									<span>Exchange rate</span>
									<div>
										<button id="exchrate_b" class="dashed_btn resbal_btn" type="button" onclick="onExchRateSelect();"><span><?=$rtExchange?></span></button>
									</div>
								</div>
<?php	}	?>
								<div id="dest_res_balance_left">
									<span>Result balance</span>
									<div>
										<button id="resbal_d_b" class="dashed_btn resbal_btn" type="button" onclick="onResBalanceDestSelect();"><span><?=$rtDestResBal?></span></button>
									</div>
								</div>
							</div>
						</div>
<?php	}	?>
						<div id="amount_row" class="non_float">
							<div><label for="amount">Amount</label></div>
							<div>
								<div class="curr_container">
<?php	if ($trans_type == 3) {		?>
									<div class="btn rcurr_btn inact_rbtn"><div id="amountsign"><?=$amountSign?></div></div>
<?php	} else {	?>
									<div class="btn rcurr_btn"><div id="amountsign"><?=$amountSign?></div></div>
<?php	}	?>
									<input id="transcurr" name="transcurr" type="hidden" value="<?=$amountCurr?>">
								</div>
<?php	if ($trans_type == 3) {		?>
								<div class="stretch_input trans_input">
<?php	} else {	?>
								<div class="stretch_input rbtn_input">
<?php	}	?>
									<div>
										<input id="amount" name="amount" class="summ_text" type="text" value="" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
									</div>
								</div>
							</div>
						</div>

<?php	if ($trans_type != 3 || ($trans_type == 3 && $src["curr"] == $dest["curr"])) {	?>
						<div id="chargeoff" class="non_float" style="display: none;">
<?php	} else {	?>
						<div id="chargeoff" class="non_float">
<?php	}	?>
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

<?php	if ($trans_type == 1 || $trans_type == 3) {		?>
						<div id="result_balance" class="non_float" style="display: none;">
							<div><label for="resbal"><?=$srcBalTitle?></label></div>
							<div>
								<div class="curr_container"><div class="btn rcurr_btn inact_rbtn"><div id="res_currsign"><?=$src["sign"]?></div></div></div>
								<div class="stretch_input trans_input">
									<div>
										<input id="resbal" class="summ_text" type="text" value="" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
									</div>
								</div>
							</div>
						</div>
<?php	}	?>

<?php	if ($trans_type == 2 || $trans_type == 3) {		?>
						<div id="result_balance_dest" class="non_float" style="display: none;">
							<div><label for="resbal_d"><?=$destBalTitle?></label></div>
							<div>
								<div class="curr_container"><div class="btn rcurr_btn inact_rbtn"><div id="res_currsign_d"><?=$dest["sign"]?></div></div></div>
								<div class="stretch_input trans_input">
									<div>
										<input id="resbal_d" class="summ_text" type="text" value="" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
									</div>
								</div>
							</div>
						</div>
<?php	}	?>
						<div class="non_float">
							<div id="calendar_btn" class="iconlink std_margin"><button onclick="showCalendar();" type="button"><span class="icon calendar"></span><span class="icontitle"><span class="maintitle">Change date</span><span class="addtitle"><?=$dateFmt?></span></span></button></div>
							<div id="date_block" style="display: none;">
								<div><label for="date">Date</label></div>
								<div>
									<div class="right_float">
										<button id="cal_rbtn" class="btn icon_btn cal_btn" type="button" onclick="showCalendar();"><span></span></button>
									</div>
									<div class="stretch_input rbtn_input">
										<div>
											<input id="date" name="date" type="text" value="<?=$dateFmt?>">
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
