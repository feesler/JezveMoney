<?php	include(TPL_PATH."commonhdr.tpl");	?>
<script>
	var currency = <?=JSON::encode($currArr)?>;
	var accCurr = <?=$accCurr?>;
	var transArr = <?=JSON::encode($transArr)?>;
	var filterObj = <?=JSON::encode($filterObj)?>;
	var chartData = <?=JSON::encode($statArr)?>;

	onReady(initControls);
</script>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");	?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<div class="heading">
						<h1>Statistics</h1>
					</div>

					<div>
						<div id="trtype_menu" class="subHeader">
<?php	forEach($transMenu as $menuItem) {
			if ($menuItem->type == $trans_type) {		?>
							<span><b><?=e($menuItem->title)?></b></span>
<?php		} else {		?>
							<span><a href="<?=e($menuItem->link)?>"><?=e($menuItem->title)?></a></span>
<?php		}
		}	?>
						</div>

						<div class="std_margin clearfix">
							<div class="tr_filter filter_sel">
								<select id="filter_type">
<?php	foreach($byCurrArr as $ind => $byCurrItem) {	?>
<?php		if ($byCurrItem["selected"]) {		?>
									<option value="<?=$ind?>" selected><?=$byCurrItem["title"]?></option>
<?php		} else {	?>
									<option value="<?=$ind?>"><?=$byCurrItem["title"]?></option>
<?php		}	?>
<?php	}	?>
								</select>
							</div>

<?php	if ($byCurrency) {		?>
							<div id="acc_block" class="tr_filter filter_sel" style="display: none;">
<?php	} else {	?>
							<div id="acc_block" class="tr_filter filter_sel">
<?php	}	?>
								<select id="acc_id">
<?php	foreach($accArr as $accInfo) {
			if ($accInfo->id == $acc_id) {	?>
									<option value="<?=$accInfo->id?>" selected><?=$accInfo->name?></option>
<?php		} else {	?>
									<option value="<?=$accInfo->id?>"><?=$accInfo->name?></option>
<?php		}
		}		?>
								</select>
							</div>

<?php	if ($byCurrency) {		?>
							<div id="curr_block" class="tr_filter filter_sel">
<?php	} else {	?>
							<div id="curr_block" class="tr_filter filter_sel" style="display: none;">
<?php	}	?>
								<select id="curr_id">
<?php	foreach($currArr as $currInfo) {
			if ($currInfo->id == $curr_id) {	?>
									<option value="<?=$currInfo->id?>" selected><?=$currInfo->name?></option>
<?php		} else {	?>
									<option value="<?=$currInfo->id?>"><?=$currInfo->name?></option>
<?php		}
		}		?>
								</select>
							</div>

							<div class="tr_filter filter_sel">
								<select id="groupsel">
<?php	foreach($groupTypes as $val => $grtype) {	?>
<?php		if ($val == $groupType_id) {		?>
									<option value="<?=$val?>" selected><?=$grtype?></option>
<?php		} else { ?>
									<option value="<?=$val?>"><?=$grtype?></option>
<?php		} ?>
<?php	}	?>
								</select>
							</div>
						</div>

						<div class="std_margin clearfix">
							<div class="tr_filter">
<?php	if (is_empty($dateFmt)) {		?>
								<div id="calendar_btn" class="iconlink std_margin"><button type="button"><span class="icon calendar"></span><span class="icontitle"><span>Select range</span></span></button></div>
<?php	} else { 	?>
								<div id="calendar_btn" class="iconlink std_margin"><button type="button"><span class="icon calendar"></span><span class="icontitle"><span class="maintitle">Select range</span><span class="subtitle"><?=$dateFmt?></span></span></button></div>
<?php	} 	?>
								<div id="date_block" style="display: none;">
									<div>
										<button id="cal_rbtn" class="btn icon_btn cal_btn right_float" type="button"><span></span></button>
										<div class="stretch_input rbtn_input">
											<input id="date" name="date" type="text" value="<?=$dateFmt?>">
										</div>
										<div id="calendar"></div>
									</div>
								</div>
							</div>
						</div>

						<div id="chart" class="charts">
<?php	if (!$statArr || !is_array($statArr->values) || !count($statArr->values)) {	?>
						<span>No results found.</span>
<?php	}		?>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
</body>
</html>
