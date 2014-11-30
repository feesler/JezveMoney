<?php	include("./templates/commonhdr.tpl");	?>
<link rel="stylesheet" media="all and (min-width: 701px)" type="text/css" href="./css/screen.css" />
<script>
	var accounts = <?=f_json_encode($accArr)?>;
	var currency = <?=f_json_encode($currArr)?>;
	var transArr = <?=f_json_encode($transArr)?>;
	var transType = <?=f_json_encode($type_str)?>;
	var curAccId = <?=f_json_encode($accFilter)?>;
	var searchRequest = <?=f_json_encode($searchReq)?>;
	var detailsMode = <?=(($showDetails) ? "true" : "false")?>;

	onReady(initTransListDrag);
	onReady(initToolbar);
</script>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	require_once("./templates/header.tpl");	?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<div class="heading">
						<h1>Transactions</h1>
						<div id="add_btn" class="iconlink"><a href="./transaction.php?act=new"><span class="icon add"></span><span class="icontitle"><span>New</span></span></a></div>
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

						<form method="get" action="./transactions.php" onsubmit="return onSearchSubmit(this);">
						<div class="search_input std_input">
							<div>
								<input id="search" name="search" type="text" value="<?=(is_null($searchReq) ? "" : $searchReq)?>">
								<button class="btn icon_btn search_btn" type="submit"><span></span></button>
							</div>
						</div>
						</form>

						<div class="tr_filter std_input">
							<div>
								<select id="acc_id" name="acc_id" multiple onchange="onAccountChange(this);">
									<option value="0">All</option>
<?php	foreach($accArr as $accData) {
			if (in_array($accData[0], $accFilter)) {		?>
									<option value="<?=$accData[0]?>" selected><?=$accData[4]?></option>
<?php		} else {		?>
									<option value="<?=$accData[0]?>"><?=$accData[4]?></option>
<?php		}
		}	?>
								</select>
							</div>
						</div>

						<div class="tr_filter date_filter">
<?php if (is_empty($dateFmt)) {		?>
							<div id="calendar_btn" class="iconlink std_margin"><button onclick="showCalendar();" type="button"><span class="icon calendar"></span><span class="icontitle"><span>Select range</span></span></button></div>
<?php } else {	?>
							<div id="calendar_btn" class="iconlink std_margin"><button onclick="showCalendar();" type="button"><span class="icon calendar"></span><span class="icontitle"><span class="maintitle">Select range</span><span class="addtitle"><?=$dateFmt?></span></span></button></div>
<?php }		?>
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

<?php
	include("./templates/trlist.tpl");
?>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div id="toolbar" class="sidebar" style="display: none;">
		<div>
			<div id="tb_content" class="siderbar_content">
				<div id="sbEllipsis" class="sidebar_ellipsis"></div>
				<div id="edit_btn" class="iconlink" style="display: none;"><a><span class="icon icon_white edit"></span><span class="icontitle"><span>Edit</span></span></a></div>
				<div id="del_btn" class="iconlink" style="display: none;"><button onclick="showDeletePopup();" type="button"><span class="icon icon_white del"></span><span class="icontitle"><span>Delete</span></span></button></div>
			</div>
		</div>
	</div>
</div>
<form id="delform" method="post" action="./modules/transaction.php?act=del">
<input id="deltrans" name="transactions" type="hidden" value="">
</form>
</body>
</html>
