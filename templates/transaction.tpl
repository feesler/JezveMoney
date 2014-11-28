<?php	include("./templates/commonhdr.tpl");	?>
<script>
	var accounts = <?=f_json_encode($accArr)?>;
	var currency = <?=f_json_encode($currArr)?>;
<?php	if ($action == "edit") {	?>
	var transaction =
	{
		srcAcc : <?=$tr["src_id"]?>,
		destAcc : <?=$tr["dest_id"]?>,
		srcAmount : <?=$tr["src_amount"]?>,
		destAmount : <?=$tr["dest_amount"]?>,
		srcCurr : <?=$tr["src_curr"]?>,
		destCurr : <?=$tr["dest_curr"]?>,
		type : <?=$tr["type"]?>

	};
<?php	}	?>
	var trans_type = <?=$tr["type"]?>;
	var srcCurr = <?=$tr["src_curr"]?>;
	var destCurr = <?=$tr["dest_curr"]?>;
	var edit_mode = <?=(($action == "edit") ? "true" : "false")?>;
	var canceled = false;
<?php	if ($trans_type == DEBT) {		?>
	var persons = <?=f_json_encode($persArr)?>;
	var debtType = <?=($give ? "true" : "false")?>;		// true - give, false - take
	var lastAcc_id = <?=$acc_id?>;
	var noAccount = <?=($noAccount ? "true" : "false")?>;
<?php	}	?>

	if (edit_mode)
		onReady(calcelTransaction);
	onReady(initControls);
</script>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	require_once("./templates/header.tpl");	?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<div class="heading h2_heading">
						<h2><?=$headString?></h2>
<?php	if ($action == "edit") {	?>
						<div id="del_btn" class="iconlink"><button onclick="onDelete();" type="button"><span class="icon del"></span><span class="icontitle"><span>Delete</span></span></button></div>
<?php	}	?>
					</div>
					<div>
						<form method="post" action="<?=$formAction?>" onsubmit="<?=$onFormSubmit?>">
<?php	if ($action == "edit") {	?>
						<input name="transid" type="hidden" value="<?=$tr["id"]?>">
						<input name="transtype" type="hidden" value="<?=$tr["type"]?>">
<?php	}	?>
						<div id="trtype_menu" class="subHeader">
<?php	forEach($transMenu as $menuItem) {	
			if ($menuItem[0] == $trans_type) {		?>
							<span><b><?=$menuItem[1]?></b></span>
<?php		} else {		?>
							<span><a href="<?=$menuItem[2]?>"><?=$menuItem[1]?></a></span>
<?php		}	
		}	?>
						</div>

<?php	if ($action == "new" && $acc_count < 2 && $trans_type == TRANSFER) {	?>
						<div class="align_block"><span>You need at lease two accounts for transfer.</span></div>
<?php	} else if ($action == "new" && !$acc_count && $trans_type != TRANSFER) {		?>
						<div class="align_block"><span>You have no one account. Please create one.</span></div>
<?php	} else {		?>
<?php	if ($trans_type == DEBT) {		?>
						<div id="person" class="acc_float">
							<input id="person_id" name="person_id" type="hidden" value="<?=$person_id?>">
							<div><label>Person name</label></div>
							<div>
								<div class="tile_container">
<?php		if (!$person->getCount()) {		?>
									<div id="person_tile inact" class="tile"><div class="tilelink"><span><span class="acc_bal"><?=$p_balfmt?></span><span class="acc_name"></span></span></div></div>
<?php		} else {	?>
									<div id="person_tile" class="tile"><div class="tilelink"><span><span class="acc_bal"><?=$p_balfmt?></span><span class="acc_name"><?=$person_name?></span></span></div></div>
<?php		}		?>
								</div>

								<div class="tile_right_block">
									<div id="src_amount_left" style="display: none;">
										<span>Source amount</span>
										<div>
											<button id="src_amount_b" class="dashed_btn resbal_btn" type="button" onclick="onAmountSelect();"><span><?=$rtSrcAmount?></span></button>
										</div>
									</div>
<?php		if ($srcAmountCurr != $destAmountCurr) {		?>
									<div id="exch_left">
<?php		} else {	?>
									<div id="exch_left" style="display: none;">
<?php		}	?>
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
<?php		if ($noAccount) {		?>
									<div id="dest_amount_left" style="display: none;">
										<span>Destination amount</span>
										<div>
											<button id="dest_amount_b" class="dashed_btn resbal_btn" type="button" onclick="onDestAmountSelect();"><span><?=$rtDestAmount?></span></button>
										</div>
									</div>
<?php		}	?>
								</div>
							</div>
						</div>

						<div id="source" class="acc_float">
<?php		if ($noAccount) {		?>
							<div class="tile_header"><label id="acclbl"><?=$accLbl?></label><div id="noacc_btn" class="iconlink small_icon" style="display: none;"><button onclick="toggleEnableAccount();" type="button"><span class="icon close_gray"></span></button></div></div>
							<div class="tile_container" style="display: none;">
								<div id="acc_tile" class="tile<?=$acc_ic?>"><div class="tilelink"><span><span class="acc_bal"><?=$acc_balance?></span><span class="acc_name"><?=$acc_name?></span></span></div></div>
								<input id="acc_id" name="acc_id" type="hidden" value="<?=$acc_id?>">
<?php		} else {	?>
							<div class="tile_header"><label id="acclbl"><?=$accLbl?></label><div id="noacc_btn" class="iconlink small_icon"><button onclick="toggleEnableAccount();" type="button"><span class="icon close_gray"></span></button></div></div>
							<div class="tile_container">
								<div id="acc_tile" class="tile<?=$debtAcc["iconclass"]?>"><div class="tilelink"><span><span class="acc_bal"><?=$debtAcc["balfmt"]?></span><span class="acc_name"><?=$debtAcc["name"]?></span></span></div></div>
								<input id="acc_id" name="acc_id" type="hidden" value="<?=$debtAcc["id"]?>">
<?php		}	?>
							</div>

<?php		if (!$noAccount) {		?>
							<div class="tile_right_block">
								<div id="dest_amount_left" style="display: none;">
									<span>Destination amount</span>
									<div>
										<button id="dest_amount_b" class="dashed_btn resbal_btn" type="button" onclick="onDestAmountSelect();"><span><?=$rtDestAmount?></span></button>
									</div>
								</div>
<?php		} else {	?>
							<div class="tile_right_block" style="display: none;">
<?php		}	?>
								<div id="dest_res_balance_left">
									<span>Result balance</span>
									<div>
										<button id="resbal_d_b" class="dashed_btn resbal_btn" type="button" onclick="onResBalanceDestSelect();"><span><?=$rtDestResBal?></span></button>
									</div>
								</div>
							</div>

<?php		if ($noAccount) {		?>
							<div id="selaccount" class="selacc_container">
<?php		} else {	?>
							<div id="selaccount" class="selacc_container" style="display: none;">
<?php		}	?>
								<button class="dashed_btn resbal_btn" type="button" onclick="toggleEnableAccount();"><span>Select account</span></button>
							</div>
						</div>
<?php	}	?>
<?php	if ($trans_type == EXPENSE || $trans_type == TRANSFER) {		?>
						<div id="source" class="acc_float">
							<div><label>Source account</label></div>
							<div class="tile_container">
								<div id="source_tile" class="tile<?=$src["iconclass"]?>"><div class="tilelink"><span><span class="acc_bal"><?=$src["balfmt"]?></span><span class="acc_name"><?=$src["name"]?></span></span></div></div>
								<input id="src_id" name="src_id" type="hidden" value="<?=$tr["src_id"]?>">
							</div>

							<div class="tile_right_block">
<?php	if ($trans_type == EXPENSE) {		?>
								<div id="src_amount_left" style="display: none;">
									<span>Source amount</span>
									<div>
										<button id="src_amount_b" class="dashed_btn resbal_btn" type="button" onclick="onSrcAmountSelect();"><span><?=$rtSrcAmount?></span></button>
									</div>
								</div>
<?php	}	?>
<?php	if ($trans_type == EXPENSE || $trans_type == TRANSFER) {		?>
								<div id="dest_amount_left" style="display: none;">
									<span>Destination amount</span>
									<div>
										<button id="dest_amount_b" class="dashed_btn resbal_btn" type="button" onclick="onDestAmountSelect();"><span><?=$rtDestAmount?></span></button>
									</div>
								</div>
<?php	}	?>
<?php	if (($trans_type == TRANSFER && $src["curr"] == $dest["curr"]) || (($trans_type == EXPENSE || $trans_type == INCOME) && $tr["src_curr"] == $tr["dest_curr"])) {		?>
								<div id="exch_left" style="display: none;">
<?php	} else {	?>
								<div id="exch_left">
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

<?php	if ($trans_type == INCOME || $trans_type == TRANSFER) {		?>
						<div id="destination" class="acc_float">
							<div><label>Destination account</label></div>
							<div class="tile_container">
								<div id="dest_tile" class="tile<?=$dest["iconclass"]?>"><div class="tilelink"><span><span class="acc_bal"><?=$dest["balfmt"]?></span><span class="acc_name"><?=$dest["name"]?></span></span></div></div>
								<input id="dest_id" name="dest_id" type="hidden" value="<?=$tr["dest_id"]?>">
							</div>

							<div class="tile_right_block">
								<div id="src_amount_left" style="display: none;">
									<span>Source amount</span>
									<div>
										<button id="src_amount_b" class="dashed_btn resbal_btn" type="button" onclick="onSrcAmountSelect();"><span><?=$rtSrcAmount?></span></button>
									</div>
								</div>
<?php	if ($trans_type == INCOME) {		?>
								<div id="dest_amount_left" style="display: none;">
									<span>Destination amount</span>
									<div>
										<button id="dest_amount_b" class="dashed_btn resbal_btn" type="button" onclick="onDestAmountSelect();"><span><?=$rtDestAmount?></span></button>
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
<?php	if ($trans_type == DEBT) {		?>
						<div id="operation" class="non_float">
							<div><label>Operation</label></div>
							<div class="op_sel">
								<input id="debtgive" name="debtop" type="radio" value="1" onchange="onChangeDebtOp();"<?=($give ? " checked" : "")?>><span>give</span>
								<input id="debttake" name="debtop" type="radio" value="2" onchange="onChangeDebtOp();"<?=($give ? "" : " checked")?>><span>take</span>
							</div>
						</div>
<?php	}	?>
<?php	if ($showSrcAmount) {		?>
						<div id="src_amount_row" class="non_float">
<?php	} else {	?>
						<div id="src_amount_row" class="non_float" style="display: none;">
<?php	}	?>
							<div><label for="src_amount"><?=$srcAmountLbl?></label></div>
							<div>
								<div class="curr_container">
<?php	if ($trans_type != INCOME) {		?>
									<div class="btn rcurr_btn inact_rbtn"><div id="srcamountsign"><?=$srcAmountSign?></div></div>
<?php	} else {	?>
									<div class="btn rcurr_btn"><div id="srcamountsign"><?=$srcAmountSign?></div></div>
<?php	}	?>
									<input id="src_curr" name="src_curr" type="hidden" value="<?=$srcAmountCurr?>">
								</div>
<?php	if ($trans_type != INCOME) {		?>
								<div class="stretch_input trans_input">
<?php	} else {	?>
								<div class="stretch_input rbtn_input">
<?php	}	?>
									<div>
<?php	if ($action == "edit") {	?>
										<input id="src_amount" name="src_amount" class="summ_text" type="text" value="<?=$tr["src_amount"]?>" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
<?php	} else {	?>
										<input id="src_amount" name="src_amount" class="summ_text" type="text" value="" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
<?php	}	?>
									</div>
								</div>
							</div>
						</div>

<?php	if ($showDestAmount) {		?>
						<div id="dest_amount_row" class="non_float">
<?php	} else {	?>
						<div id="dest_amount_row" class="non_float" style="display: none;">
<?php	}	?>
							<div><label for="dest_amount"><?=$destAmountLbl?></label></div>
							<div>
								<div class="curr_container">
<?php	if ($trans_type == EXPENSE) {		?>
									<div class="btn rcurr_btn"><div id="destamountsign"><?=$destAmountSign?></div></div>
<?php	} else {	?>
									<div class="btn rcurr_btn inact_rbtn"><div id="destamountsign"><?=$destAmountSign?></div></div>
<?php	}	?>
									<input id="dest_curr" name="dest_curr" type="hidden" value="<?=$destAmountCurr?>">
								</div>
<?php	if ($trans_type == EXPENSE) {		?>
								<div class="stretch_input rbtn_input">
<?php	} else {	?>
								<div class="stretch_input trans_input">
<?php	}	?>
									<div>
<?php	if ($action == "edit") {	?>
										<input id="dest_amount" name="dest_amount" class="summ_text" type="text" value="<?=$tr["dest_amount"]?>" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
<?php	} else {	?>
										<input id="dest_amount" name="dest_amount" class="summ_text" type="text" value="" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
<?php	}	?>
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
										<input id="exchrate" class="summ_text" type="text" value="<?=$exchValue?>" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
									</div>
								</div>
							</div>
						</div>

<?php	if ($trans_type == EXPENSE || $trans_type == TRANSFER || $trans_type == DEBT) {		?>
						<div id="result_balance" class="non_float" style="display: none;">
							<div><label for="resbal"><?=$srcBalTitle?></label></div>
							<div>
								<div class="curr_container"><div class="btn rcurr_btn inact_rbtn"><div id="res_currsign"><?=$src["sign"]?></div></div></div>
								<div class="stretch_input trans_input">
									<div>
<?php	if ($trans_type == DEBT) {		?>
										<input id="resbal" class="summ_text" type="text" value="<?=$person_res_balance?>" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
<?php	} else {	?>
										<input id="resbal" class="summ_text" type="text" value="" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
<?php	}	?>
									</div>
								</div>
							</div>
						</div>
<?php	}	?>

<?php	if ($trans_type == INCOME || $trans_type == TRANSFER || $trans_type == DEBT) {		?>
						<div id="result_balance_dest" class="non_float" style="display: none;">
							<div><label for="resbal_d"><?=$destBalTitle?></label></div>
							<div>
<?php	if ($trans_type == DEBT) {		?>
								<div class="curr_container"><div class="btn rcurr_btn inact_rbtn"><div id="res_currsign_d"><?=$debtAcc["sign"]?></div></div></div>
<?php	} else {	?>
								<div class="curr_container"><div class="btn rcurr_btn inact_rbtn"><div id="res_currsign_d"><?=$dest["sign"]?></div></div></div>
<?php	}	?>
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
<?php	if (is_empty($tr["comment"])) {		?>
							<div id="comm_btn" class="iconlink std_margin"><button onclick="showComment();" type="button"><span class="icon add"></span><span class="icontitle"><span>Add comment</span></span></button></div>
							<div id="comment_block" style="display: none;">
<?php	} else {	?>
							<div id="comm_btn" class="iconlink std_margin" style="display: none;"><button onclick="showComment();" type="button"><span class="icon add"></span><span class="icontitle"><span>Add comment</span></span></button></div>
							<div id="comment_block">
<?php	}	?>
								<div><label for="comm">Comment</label></div>
								<div>
									<div class="stretch_input trans_input">
										<div>
											<input id="comm" name="comm" type="text" value="<?=$tr["comment"]?>">
										</div>
									</div>
								</div>
							</div>
						</div>

						<div class="acc_controls"><input id="submitbtn" class="btn ok_btn" type="submit" value="ok"><a class="btn cancel_btn" href="./accounts.php">cancel</a></div>
<?php	}	?>
						</form>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
<?php	if ($action == "edit") {	?>
<form id="delform" method="post" action="./modules/transaction.php?act=del">
<input name="transactions" type="hidden" value="<?=$tr["id"]?>">
</form>
<?php	}	?>
</body>
</html>
