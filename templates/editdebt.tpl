<?php	include("./templates/commonhdr.tpl");	?>
<script>
	var accounts = <?=f_json_encode($accArr)?>;
	var currency = <?=f_json_encode($currArr)?>;

	var transaction =
	{
		srcAcc : <?=$tr["src_id"]?>,
		destAcc : <?=$tr["dest_id"]?>,
		amount : <?=$tr["amount"]?>,
		charge : <?=$tr["charge"]?>,
		curr_id : <?=$tr["curr"]?>,
		type : <?=$tr["type"]?>

	};
	var edit_mode = true;
	var trans_curr = <?=$tr["curr"]?>;
	var trans_acc_curr = <?=$tr["curr"]?>;
	var persons = <?=f_json_encode($persArr)?>;
	var trans_type = <?=$tr["type"]?>;
	var debtType = <?=($give ? "true" : "false")?>;		// true - give, false - take
	var lastAcc_id = <?=$acc_id?>;
	var noAccount = <?=($noAccount ? "true" : "false")?>;

	onReady(initControls);
</script>
</head>
<body>
<form method="post" action="./modules/editdebt.php" onsubmit="return onDebtSubmit(this);">
<input name="transid" type="hidden" value="<?=$tr["id"]?>">
<input name="transtype" type="hidden" value="<?=$tr["type"]?>">
<div class="page">
	<div class="page_wrapper">
<?php	require_once("./templates/header.tpl");	?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<div class="heading h2_heading">
						<h2>Edit debt</h2>
						<div id="del_btn" class="iconlink"><button onclick="onDelete();" type="button"><span class="icon del"></span><span class="icontitle"><span>Delete</span></span></button></div>
					</div>
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

						<div id="person" class="acc_float">
							<input id="person_id" name="person_id" type="hidden" value="<?=$person_id?>">
							<div><label>Person name</label></div>
							<div>
								<div class="tile_container">
									<div id="person_tile" class="tile"><div class="tilelink"><span><span class="acc_bal"><?=$p_balfmt?></span><span class="acc_name"><?=$person_name?></span></span></div></div>
								</div>

								<div class="tile_right_block">
									<div id="amount_left" style="display: none;">
										<span>Amount</span>
										<div>
											<button id="amount_b" class="dashed_btn resbal_btn" type="button" onclick="onAmountSelect();"><span><?=$rtAmount?></span></button>
										</div>
									</div>
<?php	if ($amountCurr != $chargeCurr) {		?>
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
<?php	if ($noAccount) {		?>
									<div id="charge_left" style="display: none;">
										<span>Charge</span>
										<div>
											<button id="charge_b" class="dashed_btn resbal_btn" type="button" onclick="onChargeSelect();"><span><?=$rtCharge?></span></button>
										</div>
									</div>
<?php	}	?>
								</div>
							</div>
						</div>

						<div id="source" class="acc_float">
<?php	if ($noAccount) {		?>
							<div class="tile_header"><label id="acclbl"><?=$accLbl?></label><div id="noacc_btn" class="iconlink small_icon" style="display: none;"><button onclick="toggleEnableAccount();" type="button"><span class="icon close_gray"></span></button></div></div>
							<div class="tile_container" style="display: none;">
								<div id="acc_tile" class="tile<?=$acc_ic?>"><div class="tilelink"><span><span class="acc_bal"><?=$acc_balance?></span><span class="acc_name"><?=$acc_name?></span></span></div></div>
								<input id="acc_id" name="acc_id" type="hidden" value="<?=$acc_id?>">
<?php	} else {	?>
							<div class="tile_header"><label id="acclbl"><?=$accLbl?></label><div id="noacc_btn" class="iconlink small_icon"><button onclick="toggleEnableAccount();" type="button"><span class="icon close_gray"></span></button></div></div>
							<div class="tile_container">
								<div id="acc_tile" class="tile<?=$debtAcc["iconclass"]?>"><div class="tilelink"><span><span class="acc_bal"><?=$debtAcc["balfmt"]?></span><span class="acc_name"><?=$debtAcc["name"]?></span></span></div></div>
								<input id="acc_id" name="acc_id" type="hidden" value="<?=$debtAcc["id"]?>">
<?php	}	?>
							</div>

<?php	if (!$noAccount) {		?>
							<div class="tile_right_block">
								<div id="charge_left" style="display: none;">
									<span>Charge</span>
									<div>
										<button id="charge_b" class="dashed_btn resbal_btn" type="button" onclick="onChargeSelect();"><span><?=$rtCharge?></span></button>
									</div>
								</div>
<?php	} else {	?>
							<div class="tile_right_block" style="display: none;">
<?php	}	?>
								<div id="dest_res_balance_left">
									<span>Result balance</span>
									<div>
										<button id="resbal_d_b" class="dashed_btn resbal_btn" type="button" onclick="onResBalanceDestSelect();"><span><?=$rtDestResBal?></span></button>
									</div>
								</div>
							</div>

<?php	if ($noAccount) {		?>
							<div id="selaccount" class="selacc_container">
<?php	} else {	?>
							<div id="selaccount" class="selacc_container" style="display: none;">
<?php	}	?>
								<button class="dashed_btn resbal_btn" type="button" onclick="toggleEnableAccount();"><span>Select account</span></button>
							</div>
						</div>

						<div id="operation" class="non_float">
							<div><label>Operation</label></div>
							<div class="op_sel">
								<input id="debtgive" name="debtop" type="radio" value="1" onchange="onChangeDebtOp();"<?=($give ? " checked" : "")?>><span>give</span>
								<input id="debttake" name="debtop" type="radio" value="2" onchange="onChangeDebtOp();"<?=($give ? "" : " checked")?>><span>take</span>
							</div>
						</div>

						<div id="amount_row" class="non_float">
							<div><label for="amount">Amount</label></div>
							<div>
								<div class="curr_container">
									<div class="btn rcurr_btn"><div id="amountsign"><?=$amountSign?></div></div>
									<input id="transcurr" name="transcurr" type="hidden" value="<?=$amountCurr?>">
								</div>

								<div class="stretch_input rbtn_input">
									<div>
										<input id="amount" name="amount" class="summ_text" type="text" value="<?=$tr["amount"]?>" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
									</div>
								</div>
							</div>
						</div>

<?php	if ($amountCurr == $chargeCurr) {	?>
						<div id="chargeoff" class="non_float" style="display: none;">
<?php	} else {	?>
						<div id="chargeoff" class="non_float">
<?php	}	?>
							<div><label for="charge">Charge</label></div>
							<div>
								<div class="curr_container"><div class="btn rcurr_btn inact_rbtn"><div id="chargesign"><?=$chargeSign?></div></div></div>
								<div class="stretch_input trans_input">
									<div>
										<input id="charge" name="charge" class="summ_text" type="text" value="<?=$tr["charge"]?>" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
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
										<input id="exchrate" class="summ_text" type="text" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);" value="<?=round($tr["amount"] / $tr["charge"], 5)?>">
									</div>
								</div>
							</div>
						</div>

						<div id="result_balance" class="non_float" style="display: none;">
							<div><label for="resbal">Result balance (Person)</label></div>
							<div>
								<div class="curr_container"><div class="btn rcurr_btn inact_rbtn"><div id="res_currsign"><?=$amountSign?></div></div></div>
								<div class="stretch_input trans_input">
									<div>
										<input id="resbal" class="summ_text" type="text" value="<?=$person_res_balance?>" oninput="return onFInput(this);" onkeypress="return onFieldKey(event, this);">
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
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
</form>
<form id="delform" method="post" action="./modules/deltransaction.php">
<input name="transactions" type="hidden" value="<?=$tr["id"]?>">
</form>
</body>
</html>
