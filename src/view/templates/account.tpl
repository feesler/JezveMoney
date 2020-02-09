<?php	include("./view/templates/commonhdr.tpl");	?>
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

	onReady(initControls);
</script>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	require_once("./view/templates/header.tpl");		?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<div class="heading">
						<h1><?=$headString?></h1>
<?php	if ($action == "edit") {	?>
						<div id="del_btn" class="iconlink"><button type="button"><span class="icon del"></span><span class="icontitle"><span>Delete</span></span></button></div>
<?php	}	?>
					</div>

					<div>
						<form id="accForm" method="post" action="<?=BASEURL?>accounts/<?=$action?>/">
<?php	if ($action == "edit") {		?>
						<input id="accid" name="accid" type="hidden" value="<?=$acc_id?>">
<?php	}	?>
						<div class="non_float std_margin">
							<div id="acc_tile" class="tile<?=$accInfo->iconclass?>"><button class="tilelink" type="button"><span><span class="acc_bal"><?=$accInfo->balfmt?></span><span class="acc_name"><?=$tileAccName?></span></span></button></div>
						</div>
						<div class="non_float std_margin">
							<label for="icon">Icon</label>
							<div class="std_input">
								<select id="icon" name="icon">
<?php	foreach($icons as $icon_id => $icon_name) {
			if ($icon_id == $accInfo->icon) {		?>
									<option value="<?=$icon_id?>" selected><?=$icon_name?></option>
<?php		} else {	?>
									<option value="<?=$icon_id?>"><?=$icon_name?></option>
<?php		}
		}		?>
								</select>
							</div>
						</div>
						<div class="non_float std_margin">
							<label for="accname">Account name</label>
							<div class="stretch_input std_input"><input id="accname" name="accname" type="text" value="<?=$accInfo->name?>"></div>
						</div>
						<div class="non_float std_margin">
							<label for="currency">Currency</label>
							<div class="std_input">
								<select id="currency" name="currency">
<?php	foreach($currArr as $currInfo) {
			if ($currInfo->id == $accInfo->curr_id) {	?>
									<option value="<?=$currInfo->id?>" selected><?=$currInfo->name?></option>
<?php		} else {	?>
									<option value="<?=$currInfo->id?>"><?=$currInfo->name?></option>
<?php		}
		}		?>
								</select>
							</div>
						</div>
						<div class="non_float std_margin">
							<label for="balance">Initial balance</label>
							<div>
								<div class="curr_container"><div class="btn rcurr_btn inact_rbtn"><div id="currsign"><?=($accInfo->sign)?></div></div></div>
								<div class="stretch_input std_input">
									<input class="summ_text" id="balance" name="balance" type="text" value="<?=($accInfo->initbalance)?>">
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
<input name="accounts" type="hidden" value="<?=$acc_id?>">
</form>
<?php	}	?>
</body>
</html>
