<?php	include("./view/templates/commonhdr.tpl");	?>
<script>
	var currency = <?=f_json_encode($currArr)?>;
	var accCurr = <?=$accCurr?>;
	var transArr = <?=f_json_encode($transArr)?>;
	var transType = <?=f_json_encode($type_str)?>;
	var groupType = <?=f_json_encode($groupType)?>;
	var curAccId = <?=f_json_encode($acc_id)?>;
	var chartData = <?=f_json_encode($statArr)?>;
	var filterByCurr = <?=(($byCurrency) ? "true" : "false")?>;

	onReady(initControls);
</script>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	require_once("./view/templates/header.tpl");	?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<div class="heading">
						<h1>Statistics</h1>
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

						<div class="tr_filter std_input filter_sel">
							<div>
								<select id="filter_type" onchange="onFilterChange(this);">
<?php	foreach($byCurrArr as $ind => $byCurrItem) {	?>
<?php		if ($byCurrItem["selected"]) {		?>
									<option value="<?=$ind?>" selected><?=$byCurrItem["title"]?></option>
<?php		} else {	?>
									<option value="<?=$ind?>"><?=$byCurrItem["title"]?></option>
<?php		}	?>
<?php	}	?>
								</select>
							</div>
						</div>
		
<?php	if ($byCurrency) {		?>
						<div id="acc_block" class="tr_filter std_input" style="display: none;">
<?php	} else {	?>
						<div id="acc_block" class="tr_filter std_input">
<?php	}	?>
							<div>
								<select id="acc_id" onchange="onAccountChange(this);">
<?php	foreach($accArr as $accInfo) {
			if ($accInfo[0] == $acc_id) {	?>
									<option value="<?=$accInfo[0]?>" selected><?=$accInfo[4]?></option>
<?php		} else {	?>
									<option value="<?=$accInfo[0]?>"><?=$accInfo[4]?></option>
<?php		}
		}		?>
								</select>
							</div>
						</div>

<?php	if ($byCurrency) {		?>
						<div id="curr_block" class="tr_filter std_input">
<?php	} else {	?>
						<div id="curr_block" class="tr_filter std_input" style="display: none;">
<?php	}	?>
							<div>
								<select id="curr_id" onchange="onCurrChange(this);">
<?php	foreach($currArr as $currInfo) {
			if ($currInfo->id == $curr_id) {	?>
									<option value="<?=$currInfo->id?>" selected><?=$currInfo->name?></option>
<?php		} else {	?>
									<option value="<?=$currInfo->id?>"><?=$currInfo->name?></option>
<?php		}
		}		?>
								</select>
							</div>
						</div>

						<div class="tr_filter std_input group_filter">
							<div>
								<select id="groupsel" onchange="onGroupChange();">
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

						<div class="tr_filter date_filter">
<?php	if (is_empty($dateFmt)) {		?>
							<div id="calendar_btn" class="iconlink std_margin"><button onclick="showCalendar();" type="button"><span class="icon calendar"></span><span class="icontitle"><span>Select range</span></span></button></div>
<?php	} else { 	?>
							<div id="calendar_btn" class="iconlink std_margin"><button onclick="showCalendar();" type="button"><span class="icon calendar"></span><span class="icontitle"><span class="maintitle">Select range</span><span class="addtitle"><?=$dateFmt?></span></span></button></div>
<?php	} 	?>
							<div id="date_block" style="display: none;">
								<div>
									<div class="right_float">
										<button id="cal_rbtn" class="btn icon_btn cal_btn" type="button" onclick="showCalendar();"><span></span></button>
									</div>
									<div class="stretch_input rbtn_input">
										<div>
											<input id="date" name="date" type="text" value="<?=$dateFmt?>">
										</div>
									</div>
									<div id="calendar" class="calWrap transCalWrap" style="display: none;"></div>
								</div>
							</div>
						</div>

						<div id="chart" class="charts"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
</body>
</html>
