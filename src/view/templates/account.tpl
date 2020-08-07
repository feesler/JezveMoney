<?php	include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");		?>
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
						<form id="accForm" method="post" action="<?=e(BASEURL."accounts/".$action)?>/">
<?php	if ($action == "edit") {		?>
						<input id="accid" name="id" type="hidden" value="<?=e($acc_id)?>">
<?php	}	?>
						<div class="non_float std_margin">
							<div id="acc_tile" class="tile<?=e($accInfo->iconclass)?>"><button class="tilelink" type="button"><span><span class="acc_bal"><?=e($accInfo->balfmt)?></span><span class="acc_icon"><?=useIcon("tile-".$accInfo->iconname, 60, 54)?></span><span class="acc_name"><?=e($tileAccName)?></span></span></button></div>
						</div>
						<div class="non_float std_margin">
							<label for="icon">Icon</label>
							<div class="std_input">
								<select id="icon" name="icon">
<?php	foreach($icons as $icon_id => $icon_name) {
			if ($icon_id == $accInfo->icon) {		?>
									<option value="<?=e($icon_id)?>" selected><?=e($icon_name)?></option>
<?php		} else {	?>
									<option value="<?=e($icon_id)?>"><?=e($icon_name)?></option>
<?php		}
		}		?>
								</select>
							</div>
						</div>
						<div class="non_float std_margin">
							<label for="accname">Account name</label>
							<div class="stretch_input std_input"><input id="accname" name="name" type="text" value="<?=e($accInfo->name)?>"></div>
						</div>
						<div class="non_float std_margin">
							<label for="currency">Currency</label>
							<div class="std_input">
								<select id="currency" name="curr_id">
<?php	foreach($currArr as $currInfo) {
			if ($currInfo->id == $accInfo->curr_id) {	?>
									<option value="<?=e($currInfo->id)?>" selected><?=e($currInfo->name)?></option>
<?php		} else {	?>
									<option value="<?=e($currInfo->id)?>"><?=e($currInfo->name)?></option>
<?php		}
		}		?>
								</select>
							</div>
						</div>
						<div class="non_float std_margin">
							<label for="balance">Initial balance</label>
							<div>
								<div class="curr_container"><div class="btn rcurr_btn inact_rbtn"><div id="currsign"><?=e($accInfo->sign)?></div></div></div>
								<div class="stretch_input std_input">
									<input class="summ_text" id="balance" name="initbalance" type="text" value="<?=e($accInfo->initbalance)?>">
								</div>
							</div>
						</div>
						<div class="acc_controls"><input class="btn ok_btn" type="submit" value="ok"><a class="btn cancel_btn" href="<?=BASEURL?>accounts/">cancel</a></div>
						</form>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
<?php	if ($action == "edit") {	?>
<form id="delform" method="post" action="<?=BASEURL?>accounts/del">
<input name="accounts" type="hidden" value="<?=e($acc_id)?>">
</form>
<?php	}	?>

<?php	include(TPL_PATH."icons.tpl");	?>
<?php	include(TPL_PATH."footer.tpl");	?>
<script>
	var currency = <?=JSON::encode($currArr)?>;
<?php	if ($action == "edit") {	?>
	var account_id = <?=$acc_id?>;
<?php	}	?>
	var acc_name = <?=JSON::encode($accInfo->name)?>;
	var acc_currency = <?=$accInfo->curr_id?>;
	var acc_balance = <?=$accInfo->balance?>;
	var acc_init_balance = <?=$accInfo->initbalance?>;
	var new_init_balance = <?=$accInfo->initbalance?>;
	var iconType = <?=$accInfo->icon?>;

	onReady(initControls);
</script>
</body>
</html>
