<?php	include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");	?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<div class="heading">
						<h1><?=e($headString)?></h1>
<?php	if ($action == "edit") {	?>
						<div id="del_btn" class="iconlink"><button type="button"><span class="icon"><?=svgIcon("del")?></span><span class="icontitle"><span>Delete</span></span></button></div>
<?php	}	?>
					</div>
					<div>
						<form id="mainfrm" method="post" action="<?=e($formAction)?>">
<?php	if ($action == "edit") {	?>
						<input name="id" type="hidden" value="<?=e($tr["id"])?>">
<?php	}	?>
						<input name="type" type="hidden" value="<?=e($tr["type"])?>">
						<div class="trtype-menu">
<?php	forEach($transMenu as $menuItem) {
			if ($menuItem->selected) {		?>
							<span class="trtype-menu_item trtype-menu_selected-item" data-type="<?=e($menuItem->type)?>">
								<span class="trtype-menu_item_title"><?=e($menuItem->title)?></span>
							</span>
<?php		} else {		?>
							<span class="trtype-menu_item" data-type="<?=e($menuItem->type)?>">
								<a href="<?=e($menuItem->url)?>"><?=e($menuItem->title)?></a>
							</span>
<?php		}
		}	?>
						</div>

<?php	if ($action == "new" && $acc_count < 2 && $tr["type"] == TRANSFER) {	?>
						<div class="align_block"><span>You need at least two active accounts for transfer.</span></div>
<?php	} else if ($action == "new" && !$acc_count && $tr["type"] != TRANSFER) {		?>
						<div class="align_block"><span>You have no one active account. Please create one.</span></div>
<?php	} else if ($action == "new" && !$person_id && $tr["type"] == DEBT) {		?>
						<div class="align_block"><span>You have no one active person. Please create one for debts.</span></div>
<?php	} else {		?>
<?php	if ($tr["type"] == DEBT) {		?>
						<div id="person" class="account-container">
							<input id="person_id" name="person_id" type="hidden" value="<?=e($person_id)?>">
							<div class="tile_header"><label>Person name</label></div>
							<div class="tile-base">
								<div class="tile_container">
<?php		if (!$this->personMod->getCount()) {		?>
									<div id="person_tile inact" class="tile"><div class="tilelink"><span><span class="acc_bal"><?=e($p_balfmt)?></span><span class="acc_name"></span></span></div></div>
<?php		} else {	?>
									<div id="person_tile" class="tile"><div class="tilelink"><span><span class="acc_bal"><?=e($p_balfmt)?></span><span class="acc_name"><?=e($person_name)?></span></span></div></div>
<?php		}		?>
								</div>

								<div class="tile_right_block">
									<div id="src_amount_left" style="display: none;">
										<span><?=e($srcAmountLbl)?></span>
										<div>
											<button id="src_amount_b" class="dashed_btn resbal_btn" type="button"><span><?=e($rtSrcAmount)?></span></button>
										</div>
									</div>
<?php		if ($srcAmountCurr != $destAmountCurr) {		?>
									<div id="exch_left">
<?php		} else {	?>
									<div id="exch_left" style="display: none;">
<?php		}	?>
										<span>Exchange rate</span>
										<div>
											<button id="exchrate_b" class="dashed_btn resbal_btn" type="button"><span><?=e($rtExchange)?></span></button>
										</div>
									</div>
<?php		if ($give) {		?>
									<div id="src_res_balance_left">
										<span>Result balance</span>
										<div>
											<button id="resbal_b" class="dashed_btn resbal_btn" type="button"><span><?=e($rtSrcResBal)?></span></button>
										</div>
									</div>
<?php		} else {	?>
									<div id="dest_res_balance_left">
										<span>Result balance</span>
										<div>
											<button id="resbal_d_b" class="dashed_btn resbal_btn" type="button"><span><?=e($rtDestResBal)?></span></button>
										</div>
									</div>
<?php		}	?>
								</div>
							</div>
						</div>

						<div id="source" class="account-container">
<?php		if ($noAccount) {		?>
							<div class="tile_header"><label id="acclbl"><?=e($accLbl)?></label><button id="noacc_btn" class="sm-icon-btn" type="button" style="display: none;"><?=svgIcon("close")?></button></div>
							<div class="tile-base">
								<div class="tile_container" style="display: none;">
									<div id="acc_tile" class="tile<?=e($acc_ic)?>"><div class="tilelink"><span><span class="acc_bal"><?=e($acc_balance)?></span><span class="acc_name"><?=e($acc_name)?></span></span></div></div>
									<input id="acc_id" name="acc_id" type="hidden" value="<?=e($acc_id)?>">
<?php		} else {	?>
							<div class="tile_header"><label id="acclbl"><?=e($accLbl)?></label><button id="noacc_btn" class="sm-icon-btn" type="button"><?=svgIcon("close")?></button></div>
							<div class="tile-base">
								<div class="tile_container">
									<div id="acc_tile" class="tile<?=($debtAcc->iconclass)?>"><div class="tilelink"><span><span class="acc_bal"><?=($debtAcc->balfmt)?></span><span class="acc_name"><?=($debtAcc->name)?></span></span></div></div>
									<input id="acc_id" name="acc_id" type="hidden" value="<?=($debtAcc->id)?>">
<?php		}	?>
								</div>

<?php		if (!$noAccount) {		?>
								<div class="tile_right_block">
<?php		} else {	?>
								<div class="tile_right_block" style="display: none;">
<?php		}	?>
									<div id="dest_amount_left" style="display: none;">
										<span><?=e($destAmountLbl)?></span>
										<div>
											<button id="dest_amount_b" class="dashed_btn resbal_btn" type="button"><span><?=e($rtDestAmount)?></span></button>
										</div>
									</div>
<?php		if ($give) { 		?>
									<div id="dest_res_balance_left">
										<span>Result balance</span>
										<div>
											<button id="resbal_d_b" class="dashed_btn resbal_btn" type="button"><span><?=e($rtDestResBal)?></span></button>
										</div>
									</div>
<?php		} else {		?>
									<div id="src_res_balance_left">
										<span>Result balance</span>
										<div>
											<button id="resbal_b" class="dashed_btn resbal_btn" type="button"><span><?=e($rtSrcResBal)?></span></button>
										</div>
									</div>
<?php		}		?>
								</div>
							</div>
<?php		if ($noAccount) {		?>
							<div id="selaccount" class="selacc_container">
<?php		} else {	?>
							<div id="selaccount" class="selacc_container" style="display: none;">
<?php		}	?>
								<button class="dashed_btn resbal_btn" type="button"><span>Select account</span></button>
							</div>
						</div>
<?php	}	/* if ($tr["type"] == DEBT) */	?>
<?php	if ($tr["type"] == EXPENSE || $tr["type"] == TRANSFER) {		?>
						<div id="source" class="account-container">
							<div class="tile_header"><label>Source account</label></div>
							<div class="tile-base">
								<div class="tile_container">
									<div id="source_tile" class="tile<?=($src->iconclass)?>"><div class="tilelink"><span><span class="acc_bal"><?=($src->balfmt)?></span><span class="acc_name"><?=($src->name)?></span></span></div></div>
									<input id="src_id" name="src_id" type="hidden" value="<?=e($tr["src_id"])?>">
								</div>

								<div class="tile_right_block">
<?php	if ($tr["type"] == TRANSFER) {		?>
									<div id="src_amount_left" style="display: none;">
										<span><?=e($srcAmountLbl)?></span>
										<div>
											<button id="src_amount_b" class="dashed_btn resbal_btn" type="button"><span><?=e($rtSrcAmount)?></span></button>
										</div>
									</div>
<?php	}	?>
<?php	if ($tr["type"] == EXPENSE) {		?>
									<div id="dest_amount_left" style="display: none;">
										<span><?=e($destAmountLbl)?></span>
										<div>
											<button id="dest_amount_b" class="dashed_btn resbal_btn" type="button"><span><?=e($rtDestAmount)?></span></button>
										</div>
									</div>
<?php	}	?>
									<div id="src_res_balance_left">
										<span>Result balance</span>
										<div>
											<button id="resbal_b" class="dashed_btn resbal_btn" type="button"><span><?=e($rtSrcResBal)?></span></button>
										</div>
									</div>
<?php	if (($tr["type"] == TRANSFER && $src->curr_id == $dest->curr_id) || (($tr["type"] == EXPENSE || $tr["type"] == INCOME) && $tr["src_curr"] == $tr["dest_curr"])) {		?>
									<div id="exch_left" style="display: none;">
<?php	} else {	?>
									<div id="exch_left">
<?php	}	?>
										<span>Exchange rate</span>
										<div>
											<button id="exchrate_b" class="dashed_btn resbal_btn" type="button"><span><?=e($rtExchange)?></span></button>
										</div>
									</div>
								</div>
							</div>
						</div>
<?php	} else if ($tr["type"] == INCOME) {	?>
						<input id="src_id" name="src_id" type="hidden" value="<?=e($tr["src_id"])?>">
<?php	}	?>

<?php	if ($tr["type"] == INCOME || $tr["type"] == TRANSFER) {		?>
						<div id="destination" class="account-container">
							<div class="tile_header"><label>Destination account</label></div>
							<div class="tile-base">
								<div class="tile_container">
									<div id="dest_tile" class="tile<?=($dest->iconclass)?>"><div class="tilelink"><span><span class="acc_bal"><?=($dest->balfmt)?></span><span class="acc_name"><?=($dest->name)?></span></span></div></div>
									<input id="dest_id" name="dest_id" type="hidden" value="<?=e($tr["dest_id"])?>">
								</div>

								<div class="tile_right_block">
									<div id="src_amount_left" style="display: none;">
										<span><?=e($srcAmountLbl)?></span>
										<div>
											<button id="src_amount_b" class="dashed_btn resbal_btn" type="button"><span><?=e($rtSrcAmount)?></span></button>
										</div>
									</div>
									<div id="dest_amount_left" style="display: none;">
										<span><?=e($destAmountLbl)?></span>
										<div>
											<button id="dest_amount_b" class="dashed_btn resbal_btn" type="button"><span><?=e($rtDestAmount)?></span></button>
										</div>
									</div>
									<div id="dest_res_balance_left">
										<span>Result balance</span>
										<div>
											<button id="resbal_d_b" class="dashed_btn resbal_btn" type="button"><span><?=e($rtDestResBal)?></span></button>
										</div>
									</div>
<?php	if ($tr["type"] == INCOME) {		?>
<?php		if ($tr["src_curr"] == $tr["dest_curr"]) {		?>
									<div id="exch_left" style="display: none;">
<?php		} else {		?>
									<div id="exch_left">
<?php		}				?>
										<span>Exchange rate</span>
										<div>
											<button id="exchrate_b" class="dashed_btn resbal_btn" type="button"><span><?=e($rtExchange)?></span></button>
										</div>
									</div>
<?php	}	?>
								</div>
							</div>
						</div>
<?php	} else if ($tr["type"] == EXPENSE) {	?>
						<input id="dest_id" name="dest_id" type="hidden" value="<?=e($tr["dest_id"])?>">
<?php	}	?>
<?php	if ($tr["type"] == DEBT) {		?>
						<div id="operation" class="view-row">
							<div><label>Operation</label></div>
							<div class="op_sel">
								<label><input id="debtgive" name="op" type="radio" value="1"<?=($give ? " checked" : "")?>><span>give</span></label>
								<label><input id="debttake" name="op" type="radio" value="2"<?=($give ? "" : " checked")?>><span>take</span></label>
							</div>
						</div>
<?php	}	?>
<?php	if ($showSrcAmount) {		?>
						<div id="src_amount_row" class="validation-block view-row">
<?php	} else {	?>
						<div id="src_amount_row" class="validation-block view-row" style="display: none;">
<?php	}	?>
							<div><label for="src_amount"><?=e($srcAmountLbl)?></label></div>
							<div class="input-group std_margin">
								<input id="src_curr" name="src_curr" type="hidden" value="<?=e($srcAmountCurr)?>">
<?php	if ($tr["type"] != INCOME) {		?>
								<div class="stretch_input">
<?php	} else {	?>
								<div class="stretch_input rbtn_input">
<?php	}	?>
<?php	if ($action == "edit") {	?>
									<input id="src_amount" name="src_amount" class="summ_text" type="text" value="<?=e($tr["src_amount"])?>">
<?php	} else {	?>
									<input id="src_amount" name="src_amount" class="summ_text" type="text" value="">
<?php	}	?>
								</div>
<?php	if ($tr["type"] != INCOME) {		?>
								<div class="btn rcurr_btn inact_rbtn"><div id="srcamountsign"><?=e($srcAmountSign)?></div></div>
<?php	} else {	?>
								<div class="btn rcurr_btn"><div id="srcamountsign"><?=e($srcAmountSign)?></div></div>
<?php	}	?>
								<div class="invalid-feedback">Please input correct amount.</div>
							</div>
						</div>

<?php	if ($showDestAmount) {		?>
						<div id="dest_amount_row" class="validation-block view-row">
<?php	} else {	?>
						<div id="dest_amount_row" class="validation-block view-row" style="display: none;">
<?php	}	?>
							<div><label for="dest_amount"><?=e($destAmountLbl)?></label></div>
							<div class="input-group std_margin">
								<input id="dest_curr" name="dest_curr" type="hidden" value="<?=e($destAmountCurr)?>">
<?php	if ($tr["type"] == EXPENSE) {		?>
								<div class="stretch_input rbtn_input">
<?php	} else {	?>
								<div class="stretch_input">
<?php	}	?>
<?php	if ($action == "edit") {	?>
									<input id="dest_amount" name="dest_amount" class="summ_text" type="text" value="<?=e($tr["dest_amount"])?>">
<?php	} else {	?>
									<input id="dest_amount" name="dest_amount" class="summ_text" type="text" value="">
<?php	}	?>
								</div>
<?php	if ($tr["type"] == EXPENSE) {		?>
								<div class="btn rcurr_btn"><div id="destamountsign"><?=e($destAmountSign)?></div></div>
<?php	} else {	?>
								<div class="btn rcurr_btn inact_rbtn"><div id="destamountsign"><?=e($destAmountSign)?></div></div>
<?php	}	?>
								<div class="invalid-feedback">Please input correct amount.</div>
							</div>
						</div>

						<div id="exchange" class="view-row" style="display: none;">
							<div><label for="exchrate">Exchange rate</label></div>
							<div class="input-group std_margin">
								<span id="exchcomm" class="exchrate_comm"><?=e($exchSign)?></span>
								<div class="stretch_input">
									<input id="exchrate" class="summ_text" type="text" value="<?=e($exchValue)?>">
								</div>
							</div>
						</div>

<?php	if ($tr["type"] == EXPENSE || $tr["type"] == TRANSFER || $tr["type"] == DEBT) {		?>
						<div id="result_balance" class="view-row" style="display: none;">
							<div><label for="resbal"><?=e($srcBalTitle)?></label></div>
							<div class="input-group std_margin">
								<div class="stretch_input">
<?php	if ($tr["type"] == DEBT) {		?>
									<input id="resbal" class="summ_text" type="text" value="<?=($give ? $person_res_balance : ($debtAcc ? $debtAcc->balance : ""))?>">
<?php	} else {	?>
									<input id="resbal" class="summ_text" type="text" value="<?=($src->balance)?>">
<?php	}	?>
								</div>
								<div class="btn rcurr_btn inact_rbtn"><div id="res_currsign"><?=e($srcAmountSign)?></div></div>
							</div>
						</div>
<?php	}	?>

<?php	if ($tr["type"] == INCOME || $tr["type"] == TRANSFER || $tr["type"] == DEBT) {		?>
						<div id="result_balance_dest" class="view-row" style="display: none;">
							<div><label for="resbal_d"><?=e($destBalTitle)?></label></div>
							<div class="input-group std_margin">
								<div class="stretch_input">
<?php	if ($tr["type"] == DEBT) {		?>
									<input id="resbal_d" class="summ_text" type="text" value="<?=($give ? ($debtAcc ? $debtAcc->balance : "") : $person_res_balance )?>">
<?php	} else {	?>
									<input id="resbal_d" class="summ_text" type="text" value="<?=($dest->balance)?>">
<?php	}	?>
								</div>
								<div class="btn rcurr_btn inact_rbtn"><div id="res_currsign_d"><?=e($destAmountSign)?></div></div>
							</div>
						</div>
<?php	}	?>
						<div class="view-row">
							<div id="calendar_btn" class="iconlink std_margin"><button type="button"><span class="icon"><?=svgIcon("cal")?></span><span class="icontitle"><span class="maintitle">Change date</span><span class="subtitle"><?=e($dateFmt)?></span></span></button></div>
							<div id="date_block" class="validation-block" style="display: none;">
								<div><label for="date">Date</label></div>
								<div class="column-container std_margin">
									<div class="input-group">
										<div class="stretch_input rbtn_input">
											<input id="date" name="date" type="text" value="<?=e($dateFmt)?>">
										</div>
										<button id="cal_rbtn" class="btn icon_btn cal_btn" type="button"><?=svgIcon("cal")?></button>
									</div>
									<div id="calendar"></div>
								</div>
								<div class="invalid-feedback">Please input correct date.</div>
							</div>
						</div>

						<div class="view-row">
<?php	if (is_empty($tr["comment"])) {		?>
							<div id="comm_btn" class="iconlink std_margin"><button type="button"><span class="icon"><?=svgIcon("plus")?></span><span class="icontitle"><span>Add comment</span></span></button></div>
							<div id="comment_block" style="display: none;">
<?php	} else {	?>
							<div id="comm_btn" class="iconlink std_margin" style="display: none;"><button type="button"><span class="icon"><?=svgIcon("plus")?></span><span class="icontitle"><span>Add comment</span></span></button></div>
							<div id="comment_block">
<?php	}	?>
								<div><label for="comm">Comment</label></div>
								<div class="std_margin">
									<div class="stretch_input">
										<input id="comm" name="comment" type="text" value="<?=e($tr["comment"])?>">
									</div>
								</div>
							</div>
						</div>

						<div class="acc_controls"><input id="submitbtn" class="btn ok_btn" type="submit" value="ok"><a class="btn cancel_btn" href="<?=BASEURL?>">cancel</a></div>
<?php	}	?>
						</form>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
<?php	if ($action == "edit") {	?>
<form id="delform" method="post" action="<?=BASEURL?>transactions/del/">
<input name="transactions" type="hidden" value="<?=e($tr["id"])?>">
</form>
<?php	}	?>

<?php	include(TPL_PATH."footer.tpl");	?>
<script>
	var accounts = <?=JSON::encode($accArr)?>;
	var currency = <?=JSON::encode($currArr)?>;
<?php	if ($action == "edit") {	?>
	var edit_transaction =
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
	var edit_mode = <?=(($action == "edit") ? "true" : "false")?>;
<?php	if ($tr["type"] == DEBT) {		?>
	var persons = <?=JSON::encode($persArr)?>;
<?php	}	?>

<?php	if ($tr["type"] == DEBT) {		?>
	var Transaction = new TransactionModel(<?=$tr["type"]?>, <?=$tr["src_curr"]?>, <?=$tr["dest_curr"]?>, <?=$person_id?>, <?=($give ? "true" : "false")?>, <?=$acc_id?>, <?=($noAccount ? "true" : "false")?>);
<?php	} else {		?>
	var Transaction = new TransactionModel(<?=$tr["type"]?>, <?=$tr["src_curr"]?>, <?=$tr["dest_curr"]?>);
<?php	}		?>

	var ViewModel = new TransactionViewModel();

	onReady(Transaction.initModel.bind(Transaction));
	onReady(ViewModel.initControls.bind(ViewModel));
</script>
</body>
</html>
